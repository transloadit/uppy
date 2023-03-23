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

const pausingUploadReason = Symbol('pausing upload, not an actual error')

class MultipartUploader {
  #abortController = new AbortController()

  #chunks

  #chunkState

  #data

  #file

  #uploadPromise

  #onError

  #onSuccess

  #onReject = (err) => (err?.cause === pausingUploadReason ? null : this.#onError(err))

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

    this.#initChunks()
  }

  #initChunks () {
    const desiredChunkSize = this.options.getChunkSize(this.#data)
    // at least 5MB per request, at most 10k requests
    const fileSize = this.#data.size
    const minChunkSize = Math.max(5 * MB, Math.ceil(fileSize / 10000))
    const chunkSize = Math.max(desiredChunkSize, minChunkSize)

    // Upload zero-sized files in one zero-sized chunk
    if (this.#data.size === 0) {
      this.#chunks = [this.#data]
      this.#data.onProgress = this.#onPartProgress(0)
      this.#data.onComplete = this.#onPartComplete(0)
    } else {
      const arraySize = Math.ceil(fileSize / chunkSize)
      this.#chunks = Array(arraySize)
      let j = 0
      for (let i = 0; i < fileSize; i += chunkSize) {
        const end = Math.min(fileSize, i + chunkSize)
        const chunk = this.#data.slice(i, end)
        chunk.onProgress = this.#onPartProgress(j)
        chunk.onComplete = this.#onPartComplete(j)
        this.#chunks[j++] = chunk
      }
    }

    this.#chunkState = this.#chunks.map(() => ({ uploaded: 0 }))
  }

  #createUpload () {
    this.#uploadPromise = this
      .options.companionComm.uploadFile(this.#file, this.#chunks, this.#abortController.signal)
      .then(this.#onSuccess, this.#onReject)
  }

  #resumeUpload () {
    this.#uploadPromise = this
      .options.companionComm.resumeUploadFile(this.#file, this.#chunks, this.#abortController.signal)
      .then(this.#onSuccess, this.#onReject)
  }

  #onPartProgress = (index) => (ev) => {
    if (!ev.lengthComputable) return

    const sent = ev.loaded
    this.#chunkState[index].uploaded = ensureInt(sent)

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
    if (this.#uploadPromise) {
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
