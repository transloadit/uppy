import { AbortController } from '@uppy/utils/lib/AbortController'

const MB = 1024 * 1024

const defaultOptions = {
  getChunkSize (file) {
    return Math.ceil(file.size / 10000)
  },
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

export const pausingUploadReason = Symbol('pausing upload, not an actual error')

class MultipartUploader {
  #abortController = new AbortController()

  /** @type {import("../types/chunk").Chunk[]} */
  #chunks

  /** @type {{ uploaded: number, etag?: string, done?: boolean }[]} */
  #chunkState

  /**
   * The (un-chunked) data to upload.
   *
   * @type {Blob}
   */
  #data

  /** @type {import("@uppy/core").UppyFile} */
  #file

  /** @type {boolean} */
  #uploadHasStarted = false

  /** @type {(err?: Error | any) => any} */
  #onError

  /** @type {() => any} */
  #onSuccess

  /** @type {typeof import('../types/index').AwsS3MultipartOptions["shouldUseMultipart"]} */
  #shouldUseMultipart

  #onReject = (err) => (err?.cause === pausingUploadReason ? null : this.#onError(err))

  #maxMultipartParts = 10_000

  #minPartSize = 5 * MB

  constructor (data, options) {
    this.options = {
      ...defaultOptions,
      ...options,
    }
    // Use default `getChunkSize` if it was null or something
    this.options.getChunkSize ??= defaultOptions.getChunkSize

    this.#data = data
    this.#file = options.file
    this.#onSuccess = this.options.onSuccess
    this.#onError = this.options.onError
    this.#shouldUseMultipart = this.options.shouldUseMultipart

    this.#initChunks()
  }

  // initChunks checks the user preference for using multipart uploads (opts.shouldUseMultipart)
  // and calculates the optimal part size. When using multipart part uploads every part except for the last has
  // to be at least 5 MB and there can be no more than 10K parts.
  // This means we sometimes need to change the preferred part size from the user in order to meet these requirements.
  #initChunks () {
    const fileSize = this.#data.size
    const shouldUseMultipart = typeof this.#shouldUseMultipart === 'function'
      ? this.#shouldUseMultipart(this.#file)
      : Boolean(this.#shouldUseMultipart)

    if (shouldUseMultipart && fileSize > this.#minPartSize) {
      // At least 5MB per request:
      let chunkSize = Math.max(this.options.getChunkSize(this.#data), this.#minPartSize)
      let arraySize = Math.floor(fileSize / chunkSize)

      // At most 10k requests per file:
      if (arraySize > this.#maxMultipartParts) {
        arraySize = this.#maxMultipartParts
        chunkSize = fileSize / this.#maxMultipartParts
      }
      this.#chunks = Array(arraySize)

      for (let i = 0, j = 0; i < fileSize; i += chunkSize, j++) {
        const end = Math.min(fileSize, i + chunkSize)

        // Defer data fetching/slicing until we actually need the data, because it's slow if we have a lot of files
        const getData = () => {
          const i2 = i
          return this.#data.slice(i2, end)
        }

        this.#chunks[j] = {
          getData,
          onProgress: this.#onPartProgress(j),
          onComplete: this.#onPartComplete(j),
          shouldUseMultipart,
        }
      }
    } else {
      this.#chunks = [{
        getData: () => this.#data,
        onProgress: this.#onPartProgress(0),
        onComplete: this.#onPartComplete(0),
        shouldUseMultipart,
      }]
    }

    this.#chunkState = this.#chunks.map(() => ({ uploaded: 0 }))
  }

  #createUpload () {
    this
      .options.companionComm.uploadFile(this.#file, this.#chunks, this.#abortController.signal)
      .then(this.#onSuccess, this.#onReject)
    this.#uploadHasStarted = true
  }

  #resumeUpload () {
    this
      .options.companionComm.resumeUploadFile(this.#file, this.#chunks, this.#abortController.signal)
      .then(this.#onSuccess, this.#onReject)
  }

  #onPartProgress = (index) => (ev) => {
    if (!ev.lengthComputable) return

    this.#chunkState[index].uploaded = ensureInt(ev.loaded)

    const totalUploaded = this.#chunkState.reduce((n, c) => n + c.uploaded, 0)
    this.options.onProgress(totalUploaded, this.#data.size)
  }

  #onPartComplete = (index) => (etag) => {
    // This avoids the net::ERR_OUT_OF_MEMORY in Chromium Browsers.
    this.#chunks[index] = null
    this.#chunkState[index].etag = etag
    this.#chunkState[index].done = true

    const part = {
      PartNumber: index + 1,
      ETag: etag,
    }
    this.options.onPartComplete(part)
  }

  #abortUpload () {
    this.#abortController.abort()
    this.options.companionComm.abortFileUpload(this.#file).catch((err) => this.options.log(err))
  }

  start () {
    if (this.#uploadHasStarted) {
      if (!this.#abortController.signal.aborted) this.#abortController.abort(pausingUploadReason)
      this.#abortController = new AbortController()
      this.#resumeUpload()
    } else {
      this.#createUpload()
    }
  }

  pause () {
    this.#abortController.abort(pausingUploadReason)
    // Swap it out for a new controller, because this instance may be resumed later.
    this.#abortController = new AbortController()
  }

  abort (opts = undefined) {
    if (opts?.really) this.#abortUpload()
    else this.pause()
  }

  // TODO: remove this in the next major
  get chunkState () {
    return this.#chunkState
  }
}

export default MultipartUploader
