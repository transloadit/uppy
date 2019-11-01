const router = require('express').Router
const ms = require('ms')

module.exports = function b2 (config) {
  if (typeof config.getPath !== 'function') {
    throw new TypeError('b2: the `getPath` option must be a function')
  }

  const getCachedBucketID = (() => {
    const cache = Object.create({})
    return (client, bucketName) => {
      const match = cache[bucketName]
      if (match && match.expiration < Date.now()) {
        return match.result
      } else {
        return (cache[bucketName] = {
          result: client.getBucketId({ bucketName }),
          expiration: Date.now() + (config.cacheBucketIdDurationMS || ms('30m'))
        }).result
      }
    }
  })()

  /**
   * Initiate a B2 large file upload.
   *
   * Expected JSON body:
   *  - filename - The name of the file, given to the `config.getPath`
   *    option to determine the object's final path in the B2 bucket.
   *  - type - The MIME type of the file
   *
   * Response JSON:
   *  - fileId - The unique B2 fileId which will be used again to initiate
   *    the actual file transfer.
   */
  function createMultipartUpload (req, res, next) {
    const client = req.uppy.b2Client
    const fileName = config.getPath(req, req.body.filename)
    const { type } = req.body

    if (typeof fileName !== 'string') {
      return res.status(500).json({ error: 'b2: filename returned from `getPath` must be a string' })
    }
    if (typeof type !== 'string') {
      return res.status(400).json({ error: 'b2: content type must be a string' })
    }

    return getCachedBucketID(client, config.bucket)
      .then(bucketId =>
        client.startLargeFile({
          bucketId,
          fileName,
          contentType: type
        }))
      .then(largeFileResponse => ({
        fileId: largeFileResponse.fileId,
        bucketId: largeFileResponse.bucketId
      }))
      .then((data) => {
        res.json(data)
      })
      .catch(err => next(err))
  }

  /**
   * Obtain an authorization token and destination URL to
   * post upload data to.
   *
   * Expected JSON body:
   *  - fileId - The B2 fileId we would like to obtain an
   *    upload destination for.
   *
   * Response JSON:
   *  - fileId - The unique fileId of file being uploaded
   *    (should be same as passed-in fileId)
   *  - uploadUrl - The Backblaze URL which we'll send file
   *    parts to
   *  - authorizationToken - Auth token for uploading to the
   *    aforementioned uploadUrl.
   */
  function getEndpoint (req, res, next) {
    const client = req.uppy.b2Client
    const { fileId } = req.params

    if (typeof fileId !== 'string') {
      return res.status(400).json({ error: 'b2: fileId type must be a string' })
    }

    client.getUploadPartURL({ fileId })
      .then(data => res.json(data))
      .catch(err => next(err))
  }

  function getEndpointSmall (req, res, next) {
    const client = req.uppy.b2Client

    return getCachedBucketID(client, config.bucket)
      .then(bucketId =>
        client.getUploadURL({
          bucketId
        }).then(data =>
          res.json(data)
        ).catch(err => next(err))
      )
  }

  function getUploadedParts (req, res, next) {
    const client = req.uppy.b2Client
    const { fileId } = req.params

    if (typeof fileId !== 'string') {
      return res.status(400).json({ error: 'b2: fileId type must be a string' })
    }

    const fetchParts = (prevParts = [], nextPartNumber) => {
      const params = {
        fileId,
        maxPartCount: 1000
      }
      if (nextPartNumber) {
        params.nextPartNumber = nextPartNumber
      }
      return client.listParts(params)
        .then(response => {
          const parts = [
            ...prevParts,
            ...(response.parts.map(part => ({
              PartNumber: part.partNumber,
              Size: part.contentLength
            }))
            )
          ]

          if (response.nextPartNumber) {
            return fetchParts(parts, response.nextPartNumber)
          } else {
            return Promise.resolve(parts)
          }
        })
    }

    fetchParts()
      .then(parts => res.json({ parts }))
      .catch(err => next(err))
  }

  /**
   * Finish off a multipart upload.
   *
   * Expected JSON body:
   *  - fileId - The unique fileId of the file being uploaded
   *  - partSha1Array - An array containing the hex digests of
   *    each of the uploaded parts (in order). This is used on
   *    the receiving end to verify the integrity of the upload.
   *
   * Response JSON:
   *  see https://www.backblaze.com/b2/docs/b2_finish_large_file.html
   */
  function completeMultipartUpload (req, res, next) {
    const client = req.uppy.b2Client
    const { partSha1Array } = req.body
    const { fileId } = req.params

    if (typeof fileId !== 'string') {
      return res.status(400).json({ error: 'b2: fileId type must be a string' })
    }

    if (typeof partSha1Array === 'undefined' || typeof partSha1Array.length !== 'number') {
      return res.status(400).json({ error: 'b2: partSha1Array array not found' })
    }

    client.finishLargeFile({ fileId, partSha1Array })
      .then(data => res.json(data))
      .catch(err => next(err))
  }

  function abortMultipartUpload (req, res, next) {
    const client = req.uppy.b2Client
    const { fileId } = req.params

    if (typeof fileId !== 'string') {
      return res.status(400).json({ error: 'b2: fileId type must be a string' })
    }

    client.cancelLargeFile({ fileId })
      .then(data => res.json(data))
      .catch(err => next(err))
  }

  return router()
    .post('/upload', getEndpointSmall)
    .post('/multipart', createMultipartUpload)
    .post('/multipart/:fileId', getEndpoint)
    .get('/multipart/:fileId', getUploadedParts)
    .post('/multipart/:fileId/complete', completeMultipartUpload)
    .delete('/multipart/:fileId', abortMultipartUpload)
}
