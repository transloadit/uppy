const { AbortController, createAbortError } = require('@uppy/utils/lib/AbortController')
const delay = require('@uppy/utils/lib/delay')

const MB = 1024 * 1024

const defaultOptions = {
  limit: 1,
  retryDelays: [0, 1000, 3000, 5000],
  getChunkSize (file) {
    return Math.ceil(file.size / 10000)
  },
  onStart () {},
  onProgress () {},
  onPartComplete () {},
  onSuccess () {},
  onError (err) {
    throw err
  }
}

function ensureInt (value) {
  if (typeof value === 'string') {
    return parseInt(value, 10)
  }
  if (typeof value === 'number') {
    return value
  }
  throw new TypeError('Expected a number')
}

class MultipartUploader {
  constructor (file, options) {
    this.options = {
      ...defaultOptions,
      ...options
    }
    // Use default `getChunkSize` if it was null or something
    if (!this.options.getChunkSize) {
      this.options.getChunkSize = defaultOptions.getChunkSize
    }

    this.file = file
    this.abortController = new AbortController()

    this.key = this.options.key || null
    this.uploadId = this.options.uploadId || null
    this.parts = []

    // Do `this.createdPromise.then(OP)` to execute an operation `OP` _only_ if the
    // upload was created already. That also ensures that the sequencing is right
    // (so the `OP` definitely happens if the upload is created).
    //
    // This mostly exists to make `_abortUpload` work well: only sending the abort request if
    // the upload was already created, and if the createMultipartUpload request is still in flight,
    // aborting it immediately after it finishes.
    this.createdPromise = Promise.reject() // eslint-disable-line prefer-promise-reject-errors
    this.isPaused = false
    this.partsInProgress = 0
    this.chunks = null
    this.chunkState = null

    this._initChunks()

    this.createdPromise.catch(() => {}) // silence uncaught rejection warning
  }

  /**
   * Was this upload aborted?
   *
   * If yes, we may need to throw an AbortError.
   *
   * @returns {boolean}
   */
  _aborted () {
    return this.abortController.signal.aborted
  }

  _initChunks () {
    const chunks = []
    const desiredChunkSize = this.options.getChunkSize(this.file)
    // at least 5MB per request, at most 10k requests
    const minChunkSize = Math.max(5 * MB, Math.ceil(this.file.size / 10000))
    const chunkSize = Math.max(desiredChunkSize, minChunkSize)

    // Upload zero-sized files in one zero-sized chunk
    if (this.file.size === 0) {
      chunks.push(this.file)
    } else {
      for (let i = 0; i < this.file.size; i += chunkSize) {
        const end = Math.min(this.file.size, i + chunkSize)
        chunks.push(this.file.slice(i, end))
      }
    }

    this.chunks = chunks
    this.chunkState = chunks.map(() => ({
      uploaded: 0,
      busy: false,
      done: false
    }))
  }

  _createUpload () {
    this.createdPromise = Promise.resolve().then(() =>
      this.options.createMultipartUpload()
    )
    return this.createdPromise.then((result) => {
      if (this._aborted()) throw createAbortError()

      const valid = typeof result === 'object' && result &&
        typeof result.uploadId === 'string' &&
        typeof result.key === 'string'
      if (!valid) {
        throw new TypeError('AwsS3/Multipart: Got incorrect result from `createMultipartUpload()`, expected an object `{ uploadId, key }`.')
      }

      this.key = result.key
      this.uploadId = result.uploadId

      this.options.onStart(result)
      this._uploadParts()
    }).catch((err) => {
      this._onError(err)
    })
  }

  _resumeUpload () {
    return Promise.resolve().then(() =>
      this.options.listParts({
        uploadId: this.uploadId,
        key: this.key
      })
    ).then((parts) => {
      if (this._aborted()) throw createAbortError()

      parts.forEach((part) => {
        const i = part.PartNumber - 1

        this.chunkState[i] = {
          uploaded: ensureInt(part.Size),
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

    const need = this.options.limit - this.partsInProgress
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
      this._uploadPartRetryable(index).then(() => {
        // Continue uploading parts
        this._uploadParts()
      }, (err) => {
        this._onError(err)
      })
    })
  }

  _retryable ({ before, attempt, after }) {
    const { retryDelays } = this.options
    const { signal } = this.abortController

    if (before) before()

    function shouldRetry (err) {
      if (err.source && typeof err.source.status === 'number') {
        const { status } = err.source
        // 0 probably indicates network failure
        return status === 0 || status === 409 || status === 423 || (status >= 500 && status < 600)
      }
      return false
    }

    const doAttempt = (retryAttempt) =>
      attempt().catch((err) => {
        if (this._aborted()) throw createAbortError()

        if (shouldRetry(err) && retryAttempt < retryDelays.length) {
          return delay(retryDelays[retryAttempt], { signal })
            .then(() => doAttempt(retryAttempt + 1))
        } else {
          throw err
        }
      })

    return doAttempt(0).then((result) => {
      if (after) after()
      return result
    }, (err) => {
      if (after) after()
      throw err
    })
  }

  _uploadPartRetryable (index) {
    return this._retryable({
      before: () => {
        this.partsInProgress += 1
      },
      attempt: () => this._uploadPart(index),
      after: () => {
        this.partsInProgress -= 1
      }
    })
  }

  _uploadPart (index) {
    const body = this.chunks[index]
    this.chunkState[index].busy = true

    return Promise.resolve().then(() =>
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
        throw new TypeError('AwsS3/Multipart: Got incorrect result from `prepareUploadPart()`, expected an object `{ url }`.')
      }

      return result
    }).then(({ url, headers }) => {
      if (this._aborted()) {
        this.chunkState[index].busy = false
        throw createAbortError()
      }

      return this._uploadPartBytes(index, url, headers)
    })
  }

  _onPartProgress (index, sent, total) {
    this.chunkState[index].uploaded = ensureInt(sent)

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
  }

  _uploadPartBytes (index, url, headers) {
    const body = this.chunks[index]
    const { signal } = this.abortController

    let defer
    const promise = new Promise((resolve, reject) => {
      defer = { resolve, reject }
    })

    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url, true)
    if (headers) {
      Object.keys(headers).map((key) => {
        xhr.setRequestHeader(key, headers[key])
      })
    }
    xhr.responseType = 'text'

    function cleanup () {
      signal.removeEventListener('abort', onabort)
    }
    function onabort () {
      xhr.abort()
    }
    signal.addEventListener('abort', onabort)

    xhr.upload.addEventListener('progress', (ev) => {
      if (!ev.lengthComputable) return

      this._onPartProgress(index, ev.loaded, ev.total)
    })

    xhr.addEventListener('abort', (ev) => {
      cleanup()
      this.chunkState[index].busy = false

      defer.reject(createAbortError())
    })

    xhr.addEventListener('load', (ev) => {
      cleanup()
      this.chunkState[index].busy = false

      if (ev.target.status < 200 || ev.target.status >= 300) {
        const error = new Error('Non 2xx')
        error.source = ev.target
        defer.reject(error)
        return
      }

      this._onPartProgress(index, body.size, body.size)

      // NOTE This must be allowed by CORS.
      const etag = ev.target.getResponseHeader('ETag')
      if (etag === null) {
        defer.reject(new Error('AwsS3/Multipart: Could not read the ETag header. This likely means CORS is not configured correctly on the S3 Bucket. Seee https://uppy.io/docs/aws-s3-multipart#S3-Bucket-Configuration for instructions.'))
        return
      }

      this._onPartComplete(index, etag)
      defer.resolve()
    })

    xhr.addEventListener('error', (ev) => {
      cleanup()
      this.chunkState[index].busy = false

      const error = new Error('Unknown error')
      error.source = ev.target
      defer.reject(error)
    })

    xhr.send(body)

    return promise
  }

  _completeUpload () {
    // Parts may not have completed uploading in sorted order, if limit > 1.
    this.parts.sort((a, b) => a.PartNumber - b.PartNumber)

    return Promise.resolve().then(() =>
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
    this.abortController.abort()

    this.createdPromise.then(() => {
      this.options.abortMultipartUpload({
        key: this.key,
        uploadId: this.uploadId
      })
    }, () => {
      // if the creation failed we do not need to abort
    })
  }

  _onError (err) {
    if (err && err.name === 'AbortError') {
      return
    }

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
    this.abortController.abort()
    // Swap it out for a new controller, because this instance may be resumed later.
    this.abortController = new AbortController()

    this.isPaused = true
  }

  abort (opts = {}) {
    const really = opts.really || false

    if (!really) return this.pause()

    this._abortUpload()
  }
}

module.exports = MultipartUploader
