const express = require('express')
const {
  CreateMultipartUploadCommand,
  ListPartsCommand,
  UploadPartCommand,
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
} = require('@aws-sdk/client-s3')
const {
  STSClient,
  GetFederationTokenCommand,
} = require('@aws-sdk/client-sts')

const { createPresignedPost } = require('@aws-sdk/s3-presigned-post')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

const { rfc2047EncodeMetadata, getBucket, truncateFilename } = require('../helpers/utils')

module.exports = function s3 (config) {
  if (typeof config.acl !== 'string' && config.acl != null) {
    throw new TypeError('s3: The `acl` option must be a string or null')
  }
  if (typeof config.getKey !== 'function') {
    throw new TypeError('s3: The `getKey` option must be a function')
  }

  function getS3Client (req, res, createPresignedPostMode = false) {
    /**
     * @type {import('@aws-sdk/client-s3').S3Client}
     */
    const client = createPresignedPostMode ? req.companion.s3ClientCreatePresignedPost : req.companion.s3Client
    if (!client) res.status(400).json({ error: 'This Companion server does not support uploading to S3' })
    return client
  }

  /**
   * Get upload paramaters for a simple direct upload.
   *
   * Expected query parameters:
   *  - filename - The name of the file, given to the `config.getKey`
   *    option to determine the object key name in the S3 bucket.
   *  - type - The MIME type of the file.
   *  - metadata - Key/value pairs configuring S3 metadata. Both must be ASCII-safe.
   *    Query parameters are formatted like `metadata[name]=value`.
   *
   * Response JSON:
   *  - method - The HTTP method to use to upload.
   *  - url - The URL to upload to.
   *  - fields - Form fields to send along.
   */
  function getUploadParameters (req, res, next) {
    const client = getS3Client(req, res)
    if (!client) return

    const { metadata = {}, filename } = req.query

    const truncatedFilename = truncateFilename(
      filename, 
      req.companion.options.maxFilenameLength, 
    )

    const bucket = getBucket({ bucketOrFn: config.bucket, req, filename: truncatedFilename, metadata })

    const key = config.getKey({ req, filename: truncatedFilename, metadata })
    if (typeof key !== 'string') {
      res.status(500).json({ error: 'S3 uploads are misconfigured: filename returned from `getKey` must be a string' })
      return
    }

    const fields = {
      success_action_status: '201',
      'content-type': req.query.type,
    }

    if (config.acl != null) fields.acl = config.acl

    Object.keys(metadata).forEach((metadataKey) => {
      fields[`x-amz-meta-${metadataKey}`] = metadata[metadataKey]
    })

    createPresignedPost(client, {
      Bucket: bucket,
      Expires: config.expires,
      Fields: fields,
      Conditions: config.conditions,
      Key: key,
    }).then(data => {
      res.json({
        method: 'POST',
        url: data.url,
        fields: data.fields,
        expires: config.expires,
      })
    }, next)
  }

  /**
   * Create an S3 multipart upload. With this, files can be uploaded in chunks of 5MB+ each.
   *
   * Expected JSON body:
   *  - filename - The name of the file, given to the `config.getKey`
   *    option to determine the object key name in the S3 bucket.
   *  - type - The MIME type of the file.
   *  - metadata - An object with the key/value pairs to set as metadata.
   *    Keys and values must be ASCII-safe for S3.
   *
   * Response JSON:
   *  - key - The object key in the S3 bucket.
   *  - uploadId - The ID of this multipart upload, to be used in later requests.
   */
  function createMultipartUpload (req, res, next) {
    const client = getS3Client(req, res)
    if (!client) return

    const { type, metadata = {}, filename } = req.body

    const truncatedFilename = truncateFilename(
      filename, 
      req.companion.options.maxFilenameLength, 
    )

    const key = config.getKey({ req, filename: truncatedFilename, metadata })

    const bucket = getBucket({ bucketOrFn: config.bucket, req, filename: truncatedFilename, metadata })

    if (typeof key !== 'string') {
      res.status(500).json({ error: 's3: filename returned from `getKey` must be a string' })
      return
    }
    if (typeof type !== 'string') {
      res.status(400).json({ error: 's3: content type must be a string' })
      return
    }

    const params = {
      Bucket: bucket,
      Key: key,
      ContentType: type,
      Metadata: rfc2047EncodeMetadata(metadata),
    }

    if (config.acl != null) params.ACL = config.acl

    client.send(new CreateMultipartUploadCommand(params)).then((data) => {
      res.json({
        key: data.Key,
        uploadId: data.UploadId,
        bucket: data.Bucket
      })
    }, next)
  }

  /**
   * List parts that have been fully uploaded so far.
   *
   * Expected URL parameters:
   *  - uploadId - The uploadId returned from `createMultipartUpload`.
   * Expected query parameters:
   *  - key - The object key in the S3 bucket.
   * Response JSON:
   *  - An array of objects representing parts:
   *     - PartNumber - the index of this part.
   *     - ETag - a hash of this part's contents, used to refer to it.
   *     - Size - size of this part.
   */
  function getUploadedParts (req, res, next) {
    const client = getS3Client(req, res)
    if (!client) return

    const { uploadId } = req.params
    const { key } = req.query

    if (typeof key !== 'string') {
      res.status(400).json({ error: 's3: the object key must be passed as a query parameter. For example: "?key=abc.jpg"' })
      return
    }

    const bucket = getBucket({ bucketOrFn: config.bucket, req })

    const parts = []

    function listPartsPage (startAt) {
      client.send(new ListPartsCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        PartNumberMarker: startAt,
      })).then(({ Parts, IsTruncated, NextPartNumberMarker }) => {
        if (Parts) parts.push(...Parts)

        if (IsTruncated) {
          // Get the next page.
          listPartsPage(NextPartNumberMarker)
        } else {
          res.json(parts)
        }
      }, next)
    }
    listPartsPage()
  }

  /**
   * Get parameters for uploading one part.
   *
   * Expected URL parameters:
   *  - uploadId - The uploadId returned from `createMultipartUpload`.
   *  - partNumber - This part's index in the file (1-10000).
   * Expected query parameters:
   *  - key - The object key in the S3 bucket.
   * Response JSON:
   *  - url - The URL to upload to, including signed query parameters.
   */
  function signPartUpload (req, res, next) {
    const client = getS3Client(req, res)
    if (!client) return

    const { uploadId, partNumber } = req.params
    const { key } = req.query

    if (typeof key !== 'string') {
      res.status(400).json({ error: 's3: the object key must be passed as a query parameter. For example: "?key=abc.jpg"' })
      return
    }
    if (!parseInt(partNumber, 10)) {
      res.status(400).json({ error: 's3: the part number must be a number between 1 and 10000.' })
      return
    }

    const bucket = getBucket({ bucketOrFn: config.bucket, req })

    getSignedUrl(client, new UploadPartCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: '',
    }), { expiresIn: config.expires }).then(url => {
      res.json({ url, expires: config.expires })
    }, next)
  }

  /**
   * Get parameters for uploading a batch of parts.
   *
   * Expected URL parameters:
   *  - uploadId - The uploadId returned from `createMultipartUpload`.
   * Expected query parameters:
   *  - key - The object key in the S3 bucket.
   *  - partNumbers - A comma separated list of part numbers representing
   *                  indecies in the file (1-10000).
   * Response JSON:
   *  - presignedUrls - The URLs to upload to, including signed query parameters,
   *                    in an object mapped to part numbers.
   */
  function batchSignPartsUpload (req, res, next) {
    const client = getS3Client(req, res)
    if (!client) return

    const { uploadId } = req.params
    const { key, partNumbers } = req.query

    if (typeof key !== 'string') {
      res.status(400).json({ error: 's3: the object key must be passed as a query parameter. For example: "?key=abc.jpg"' })
      return
    }

    if (typeof partNumbers !== 'string') {
      res.status(400).json({ error: 's3: the part numbers must be passed as a comma separated query parameter. For example: "?partNumbers=4,6,7,21"' })
      return
    }

    const partNumbersArray = partNumbers.split(',')
    if (!partNumbersArray.every((partNumber) => parseInt(partNumber, 10))) {
      res.status(400).json({ error: 's3: the part numbers must be a number between 1 and 10000.' })
      return
    }

    const bucket = getBucket({ bucketOrFn: config.bucket, req })

    Promise.all(
      partNumbersArray.map((partNumber) => {
        return getSignedUrl(client, new UploadPartCommand({
          Bucket: bucket,
          Key: key,
          UploadId: uploadId,
          PartNumber: Number(partNumber),
          Body: '',
        }), { expiresIn: config.expires })
      }),
    ).then((urls) => {
      const presignedUrls = Object.create(null)
      for (let index = 0; index < partNumbersArray.length; index++) {
        presignedUrls[partNumbersArray[index]] = urls[index]
      }
      res.json({ presignedUrls })
    }).catch(next)
  }

  /**
   * Abort a multipart upload, deleting already uploaded parts.
   *
   * Expected URL parameters:
   *  - uploadId - The uploadId returned from `createMultipartUpload`.
   * Expected query parameters:
   *  - key - The object key in the S3 bucket.
   * Response JSON:
   *   Empty.
   */
  function abortMultipartUpload (req, res, next) {
    const client = getS3Client(req, res)
    if (!client) return

    const { uploadId } = req.params
    const { key } = req.query

    if (typeof key !== 'string') {
      res.status(400).json({ error: 's3: the object key must be passed as a query parameter. For example: "?key=abc.jpg"' })
      return
    }

    const bucket = getBucket({ bucketOrFn: config.bucket, req })

    client.send(new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
    })).then(() => res.json({}), next)
  }

  /**
   * Complete a multipart upload, combining all the parts into a single object in the S3 bucket.
   *
   * Expected URL parameters:
   *  - uploadId - The uploadId returned from `createMultipartUpload`.
   * Expected query parameters:
   *  - key - The object key in the S3 bucket.
   * Expected JSON body:
   *  - parts - An array of parts, see the `getUploadedParts` response JSON.
   * Response JSON:
   *  - location - The full URL to the object in the S3 bucket.
   */
  function completeMultipartUpload (req, res, next) {
    const client = getS3Client(req, res)
    if (!client) return

    const { uploadId } = req.params
    const { key } = req.query
    const { parts } = req.body

    if (typeof key !== 'string') {
      res.status(400).json({ error: 's3: the object key must be passed as a query parameter. For example: "?key=abc.jpg"' })
      return
    }
    if (
      !Array.isArray(parts)
      || !parts.every(part => typeof part === 'object' && typeof part?.PartNumber === 'number' && typeof part.ETag === 'string')
    ) {
      res.status(400).json({ error: 's3: `parts` must be an array of {ETag, PartNumber} objects.' })
      return
    }

    const bucket = getBucket({ bucketOrFn: config.bucket, req })

    client.send(new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    })).then(data => {
      res.json({
        location: data.Location,
        key: data.Key,
        bucket: data.Bucket
      })
    }, next)
  }

  const policy = {
    Version: '2012-10-17', // latest at the time of writing
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          's3:PutObject',
        ],
        Resource: [
          `arn:aws:s3:::${config.bucket}/*`,
          `arn:aws:s3:::${config.bucket}`,
        ],
      },
    ],
  }

  let stsClient
  function getSTSClient () {
    if (stsClient == null) {
      stsClient = new STSClient({
        region: config.region,
        credentials : {
          accessKeyId: config.key,
          secretAccessKey: config.secret,
        },
      })
    }
    return stsClient
  }

  /**
   * Create STS credentials with the permission for sending PutObject/UploadPart to the bucket.
   *
   * Clients should cache the response and re-use it until they can reasonably
   * expect uploads to complete before the token expires. To this effect, the
   * Cache-Control header is set to invalidate the cache 5 minutes before the
   * token expires.
   *
   * Response JSON:
   * - credentials: the credentials including the SessionToken.
   * - bucket: the S3 bucket name.
   * - region: the region where that bucket is stored.
   */
  function getTemporarySecurityCredentials (req, res, next) {
    getSTSClient().send(new GetFederationTokenCommand({
      // Name of the federated user. The name is used as an identifier for the
      // temporary security credentials (such as Bob). For example, you can
      // reference the federated user name in a resource-based policy, such as
      // in an Amazon S3 bucket policy.
      // Companion is configured by default as an unprotected public endpoint,
      // if you implement your own custom endpoint with user authentication you
      // should probably use different names for each of your users.
      Name: 'companion',
      // The duration, in seconds, of the role session. The value specified
      // can range from 900 seconds (15 minutes) up to the maximum session
      // duration set for the role.
      DurationSeconds: config.expires,
      Policy: JSON.stringify(policy),
    })).then(response => {
      // This is a public unprotected endpoint.
      // If you implement your own custom endpoint with user authentication you
      // should probably use `private` instead of `public`.
      res.setHeader('Cache-Control', `public,max-age=${config.expires - 300}`) // 300s is 5min.
      res.json({
        credentials: response.Credentials,
        bucket: config.bucket,
        region: config.region,
      })
    }, next)
  }

  if (config.bucket == null) {
    return express.Router() // empty router because s3 is not enabled
  }

  return express.Router()
    .get('/sts', getTemporarySecurityCredentials)
    .get('/params', getUploadParameters)
    .post('/multipart', express.json(), createMultipartUpload)
    .get('/multipart/:uploadId', getUploadedParts)
    .get('/multipart/:uploadId/batch', batchSignPartsUpload)
    .get('/multipart/:uploadId/:partNumber', signPartUpload)
    // limit 1mb because maybe large upload with a lot of parts, see https://github.com/transloadit/uppy/issues/1945
    .post('/multipart/:uploadId/complete', express.json({ limit: '1mb' }), completeMultipartUpload)
    .delete('/multipart/:uploadId', abortMultipartUpload)
}
