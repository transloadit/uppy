const MB = 1024 * 1024

const defaultOptions = {
  limit: 1,
  onStart () {},
  onProgress () {},
  onPartComplete () {},
  onSuccess () {},
  onError (err) {
    throw err
  }
}

function remove (arr, el) {
  const i = arr.indexOf(el)
  if (i !== -1) arr.splice(i, 1)
}

class MultipartUploader {
  constructor (file, options) {
    this.options = Object.assign({}, defaultOptions, options)
    this.file = file

    this.key = this.options.key || null
    this.uploadId = this.options.uploadId || null
    this.parts = this.options.parts || []

    this.isPaused = false
    this.chunks = null
    this.chunkState = null
    this.uploading = []

    this._initChunks()
  }

  _initChunks () {
    const chunks = []
    const chunkSize = Math.max(Math.ceil(this.file.size / 10000), 5 * MB)

    for (let i = 0; i < this.file.size; i += chunkSize) {
      const end = Math.min(this.file.size, i + chunkSize)
      chunks.push(this.file.slice(i, end))
    }

    this.chunks = chunks
    this.chunkState = chunks.map(() => ({
      uploaded: 0,
      busy: false,
      done: false
    }))
  }

  _createUpload () {
    return this.options.createMultipartUpload().then((result) => {
      const valid = typeof result === 'object' && result &&
        typeof result.uploadId === 'string' &&
        typeof result.key === 'string'
      if (!valid) {
        throw new TypeError(`AwsS3/Multipart: Got incorrect result from 'createMultipartUpload()', expected an object '{ uploadId, key }'.`)
      }
      return result
    }).then((result) => {
      this.key = result.key
      this.uploadId = result.uploadId

      this.options.onStart(result)
    }).then(() => {
      this._uploadParts()
    }).catch((err) => {
      this._onError(err)
    })
  }

  _resumeUpload () {
    this.options.listParts({
      uploadId: this.uploadId,
      key: this.key
    }).then((parts) => {
      parts.forEach((part) => {
        const i = part.PartNumber - 1
        this.chunkState[i] = {
          uploaded: part.Size,
          etag: part.ETag,
          done: true
        }

        // Only add if we did not yet know about this part.
        if (!this.parts.some((p) => p.PartNumber === part.PartNumber)) {
          this.parts.push({
            PartNumber: part.PartNumber,
            ETag: part.ETag
          })
        }
      })
      this._uploadParts()
    }).catch((err) => {
      this._onError(err)
    })
  }

  _uploadParts () {
    if (this.isPaused) return

    const need = this.options.limit - this.uploading.length
    if (need === 0) return

    // All parts are uploaded.
    if (this.chunkState.every((state) => state.done)) {
      this._completeUpload()
      return
    }

    const candidates = []
    for (let i = 0; i < this.chunkState.length; i++) {
      const state = this.chunkState[i]
      if (state.done || state.busy) continue

      candidates.push(i)
      if (candidates.length >= need) {
        break
      }
    }

    candidates.forEach((index) => {
      this._uploadPart(index)
    })
  }

  _uploadPart (index) {
    const body = this.chunks[index]
    this.chunkState[index].busy = true

    return Promise.resolve(
      this.options.prepareUploadPart({
        key: this.key,
        uploadId: this.uploadId,
        body,
        number: index + 1
      })
    ).then((result) => {
      const valid = typeof result === 'object' && result &&
        typeof result.url === 'string'
      if (!valid) {
        throw new TypeError(`AwsS3/Multipart: Got incorrect result from 'prepareUploadPart()', expected an object '{ url }'.`)
      }
      return result
    }).then(({ url }) => {
      this._uploadPartBytes(index, url)
    })
  }

  _onPartProgress (index, sent, total) {
    this.chunkState[index].uploaded = sent

    const totalUploaded = this.chunkState.reduce((n, c) => n + c.uploaded, 0)
    this.options.onProgress(totalUploaded, this.file.size)
  }

  _onPartComplete (index, etag) {
    this.chunkState[index].etag = etag
    this.chunkState[index].done = true

    const part = {
      PartNumber: index + 1,
      ETag: etag
    }
    this.parts.push(part)

    this.options.onPartComplete(part)

    this._uploadParts()
  }

  _uploadPartBytes (index, url) {
    const body = this.chunks[index]
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url, true)
    xhr.responseType = 'text'

    this.uploading.push(xhr)

    xhr.upload.addEventListener('progress', (ev) => {
      if (!ev.lengthComputable) return

      this._onPartProgress(index, ev.loaded, ev.total)
    })

    xhr.addEventListener('abort', (ev) => {
      remove(this.uploading, ev.target)
      this.chunkState[index].busy = false
    })

    xhr.addEventListener('load', (ev) => {
      remove(this.uploading, ev.target)
      this.chunkState[index].busy = false

      if (ev.target.status < 200 || ev.target.status >= 300) {
        this._onError(new Error('Non 2xx'))
        return
      }

      this._onPartProgress(index, body.size, body.size)

      // NOTE This must be allowed by CORS.
      const etag = ev.target.getResponseHeader('ETag')
      if (etag === null) {
        this._onError(new Error('AwsS3/Multipart: Could not read the ETag header. This likely means CORS is not configured correctly on the S3 Bucket. Seee https://uppy.io/docs/aws-s3-multipart#S3-Bucket-Configuration for instructions.'))
        return
      }

      this._onPartComplete(index, etag)
    })

    xhr.addEventListener('error', (ev) => {
      remove(this.uploading, ev.target)
      this.chunkState[index].busy = false

      const error = new Error('Unknown error')
      error.source = ev.target
      this._onError(error)
    })

    xhr.send(body)
  }

  _completeUpload () {
    // Parts may not have completed uploading in sorted order, if limit > 1.
    this.parts.sort((a, b) => a.PartNumber - b.PartNumber)

    return Promise.resolve(
      this.options.completeMultipartUpload({
        key: this.key,
        uploadId: this.uploadId,
        parts: this.parts
      })
    ).then((result) => {
      this.options.onSuccess(result)
    }, (err) => {
      this._onError(err)
    })
  }

  _abortUpload () {
    this.options.abortMultipartUpload({
      key: this.key,
      uploadId: this.uploadId
    })
  }

  _onError (err) {
    this.options.onError(err)
  }

  start () {
    this.isPaused = false
    if (this.uploadId) {
      this._resumeUpload()
    } else {
      this._createUpload()
    }
  }

  pause () {
    const inProgress = this.uploading.slice()
    inProgress.forEach((xhr) => {
      xhr.abort()
    })
    this.isPaused = true
  }

  abort (opts = {}) {
    const really = opts.really || false

    if (!really) return this.pause()

    this._abortUpload()
  }
}

module.exports = MultipartUploader
