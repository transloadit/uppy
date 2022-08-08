import { AbortController, createAbortError } from '@uppy/utils/lib/AbortController'
import delay from '@uppy/utils/lib/delay'

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
  },
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
      ...options,
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
    // This mostly exists to make `#abortUpload` work well: only sending the abort request if
    // the upload was already created, and if the createMultipartUpload request is still in flight,
    // aborting it immediately after it finishes.
    this.createdPromise = Promise.reject() // eslint-disable-line prefer-promise-reject-errors
    this.isPaused = false
    this.partsInProgress = 0
    this.chunks = null
    this.chunkState = null

    this.#initChunks()

    this.createdPromise.catch(() => {}) // silence uncaught rejection warning
  }

  /**
   * Was this upload aborted?
   *
   * If yes, we may need to throw an AbortError.
   *
   * @returns {boolean}
   */
  #aborted () {
    return this.abortController.signal.aborted
  }

  #initChunks () {
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
      done: false,
    }))
  }

  #createUpload () {
    this.createdPromise = Promise.resolve().then(() => this.options.createMultipartUpload())
    return this.createdPromise.then((result) => {
      if (this.#aborted()) throw createAbortError()

      const valid = typeof result === 'object' && result
        && typeof result.uploadId === 'string'
        && typeof result.key === 'string'
      if (!valid) {
        throw new TypeError('AwsS3/Multipart: Got incorrect result from `createMultipartUpload()`, expected an object `{ uploadId, key }`.')
      }

      this.key = result.key
      this.uploadId = result.uploadId

      this.options.onStart(result)
      this.#uploadParts()
    }).catch((err) => {
      this.#onError(err)
    })
  }

  async #resumeUpload () {
    try {
      const parts = await this.options.listParts({
        uploadId: this.uploadId,
        key: this.key,
      })
      if (this.#aborted()) throw createAbortError()

      parts.forEach((part) => {
        const i = part.PartNumber - 1

        this.chunkState[i] = {
          uploaded: ensureInt(part.Size),
          etag: part.ETag,
          done: true,
        }

        // Only add if we did not yet know about this part.
        if (!this.parts.some((p) => p.PartNumber === part.PartNumber)) {
          this.parts.push({
            PartNumber: part.PartNumber,
            ETag: part.ETag,
          })
        }
      })
      this.#uploadParts()
    } catch (err) {
      this.#onError(err)
    }
  }

  #uploadParts () {
    if (this.isPaused) return

    // All parts are uploaded.
    if (this.chunkState.every((state) => state.done)) {
      this.#completeUpload()
      return
    }

    const getChunkIndexes = () => {
      // For a 100MB file, with the default min chunk size of 5MB and a limit of 10:
      //
      // Total 20 parts
      // ---------
      // Need 1 is 10
      // Need 2 is 5
      // Need 3 is 5
      const need = this.options.limit - this.partsInProgress
      const completeChunks = this.chunkState.filter((state) => state.done).length
      const remainingChunks = this.chunks.length - completeChunks
      let minNeeded = Math.ceil(this.options.limit / 2)
      if (minNeeded > remainingChunks) {
        minNeeded = remainingChunks
      }
      if (need < minNeeded) return []

      const chunkIndexes = []
      for (let i = 0; i < this.chunkState.length; i++) {
        const state = this.chunkState[i]
        // eslint-disable-next-line no-continue
        if (state.done || state.busy) continue

        chunkIndexes.push(i)
        if (chunkIndexes.length >= need) {
          break
        }
      }

      return chunkIndexes
    }

    const chunkIndexes = getChunkIndexes()

    if (chunkIndexes.length === 0) return

    this.#prepareUploadPartsRetryable(chunkIndexes).then(
      ({ presignedUrls, headers }) => {
        for (const index of chunkIndexes) {
          const partNumber = index + 1
          const prePreparedPart = {
            url: presignedUrls[partNumber],
            headers: headers?.[partNumber],
          }
          this.#uploadPartRetryable(index, prePreparedPart).then(
            () => this.#uploadParts(),
            (err) => this.#onError(err),
          )
        }
      },
      (err) => this.#onError(err),
    )
  }

  #retryable ({ before, attempt, after }) {
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

    const doAttempt = (retryAttempt) => attempt().catch((err) => {
      if (this.#aborted()) throw createAbortError()

      if (shouldRetry(err) && retryAttempt < retryDelays.length) {
        return delay(retryDelays[retryAttempt], { signal })
          .then(() => doAttempt(retryAttempt + 1))
      }
      throw err
    })

    return doAttempt(0).then((result) => {
      if (after) after()
      return result
    }, (err) => {
      if (after) after()
      throw err
    })
  }

  async #prepareUploadPartsRetryable (chunkIndexes) {
    chunkIndexes.forEach((i) => {
      this.chunkState[i].busy = true
    })

    const result = await this.#retryable({
      attempt: () => this.options.prepareUploadParts({
        key: this.key,
        uploadId: this.uploadId,
        parts: chunkIndexes.map((index) => ({
          number: index + 1, // Use the part number as the index
          chunk: this.chunks[index],
        })),
      }),
    })

    if (typeof result?.presignedUrls !== 'object') {
      throw new TypeError(
        'AwsS3/Multipart: Got incorrect result from `prepareUploadParts()`, expected an object `{ presignedUrls }`.',
      )
    }

    return result
  }

  #uploadPartRetryable (index, prePreparedPart) {
    return this.#retryable({
      before: () => {
        this.chunkState[index].busy = true
        this.partsInProgress += 1
      },
      attempt: () => this.#uploadPart(index, prePreparedPart),
      after: () => {
        this.chunkState[index].busy = false
        this.partsInProgress -= 1
      },
    })
  }

  #uploadPart (index, prePreparedPart) {
    const valid = typeof prePreparedPart?.url === 'string'
    if (!valid) {
      throw new TypeError('AwsS3/Multipart: Got incorrect result for `prePreparedPart`, expected an object `{ url }`.')
    }

    const { url, headers } = prePreparedPart
    if (this.#aborted()) {
      throw createAbortError()
    }

    return this.#uploadPartBytes(index, url, headers)
  }

  #onPartProgress (index, sent) {
    this.chunkState[index].uploaded = ensureInt(sent)

    const totalUploaded = this.chunkState.reduce((n, c) => n + c.uploaded, 0)
    this.options.onProgress(totalUploaded, this.file.size)
  }

  #onPartComplete (index, etag) {
    this.chunkState[index].etag = etag
    this.chunkState[index].done = true

    const part = {
      PartNumber: index + 1,
      ETag: etag,
    }
    this.parts.push(part)

    this.options.onPartComplete(part)
  }

  #uploadPartBytes (index, url, headers) {
    const body = this.chunks[index]
    const { signal } = this.abortController

    let defer
    const promise = new Promise((resolve, reject) => {
      defer = { resolve, reject }
    })

    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url, true)
    if (headers) {
      Object.keys(headers).forEach((key) => {
        xhr.setRequestHeader(key, headers[key])
      })
    }
    xhr.responseType = 'text'

    function cleanup () {
      // eslint-disable-next-line no-use-before-define
      signal.removeEventListener('abort', onabort)
    }
    function onabort () {
      xhr.abort()
    }
    signal.addEventListener('abort', onabort)

    xhr.upload.addEventListener('progress', (ev) => {
      if (!ev.lengthComputable) return

      this.#onPartProgress(index, ev.loaded, ev.total)
    })

    xhr.addEventListener('abort', () => {
      cleanup()

      defer.reject(createAbortError())
    })

    xhr.addEventListener('load', (ev) => {
      cleanup()

      if (ev.target.status < 200 || ev.target.status >= 300) {
        const error = new Error('Non 2xx')
        error.source = ev.target
        defer.reject(error)
        return
      }

      // This avoids the net::ERR_OUT_OF_MEMORY in Chromium Browsers.
      this.chunks[index] = null

      this.#onPartProgress(index, body.size, body.size)

      // NOTE This must be allowed by CORS.
      const etag = ev.target.getResponseHeader('ETag')

      if (etag === null) {
        defer.reject(new Error('AwsS3/Multipart: Could not read the ETag header. This likely means CORS is not configured correctly on the S3 Bucket. See https://uppy.io/docs/aws-s3-multipart#S3-Bucket-Configuration for instructions.'))
        return
      }

      this.#onPartComplete(index, etag)
      defer.resolve()
    })

    xhr.addEventListener('error', (ev) => {
      cleanup()

      const error = new Error('Unknown error')
      error.source = ev.target
      defer.reject(error)
    })

    xhr.send(body)

    return promise
  }

  async #completeUpload () {
    // Parts may not have completed uploading in sorted order, if limit > 1.
    this.parts.sort((a, b) => a.PartNumber - b.PartNumber)

    try {
      const result = await this.options.completeMultipartUpload({
        key: this.key,
        uploadId: this.uploadId,
        parts: this.parts,
      })
      this.options.onSuccess(result)
    } catch (err) {
      this.#onError(err)
    }
  }

  #abortUpload () {
    this.abortController.abort()

    this.createdPromise.then(() => this.options.abortMultipartUpload({
      key: this.key,
      uploadId: this.uploadId,
    })).catch(() => {
      // if the creation failed we do not need to abort
    })
  }

  #onError (err) {
    if (err && err.name === 'AbortError') {
      return
    }

    this.options.onError(err)
  }

  start () {
    this.isPaused = false
    if (this.uploadId) {
      this.#resumeUpload()
    } else {
      this.#createUpload()
    }
  }

  pause () {
    this.abortController.abort()
    // Swap it out for a new controller, because this instance may be resumed later.
    this.abortController = new AbortController()

    this.isPaused = true
  }

  abort (opts = undefined) {
    if (opts?.really) this.#abortUpload()
    else this.pause()
  }
}

export default MultipartUploader
