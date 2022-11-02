import { AbortController } from '@uppy/utils/lib/AbortController'

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
  #abortController = new AbortController()

  #isPaused = false

  #chunks

  #chunkState

  #file

  #uploadPromise

  #onSuccess

  #onReject = (err) => this.#onError(err)

  constructor (file, options) {
    this.options = {
      ...defaultOptions,
      ...options,
    }
    // Use default `getChunkSize` if it was null or something
    this.options.getChunkSize ??= defaultOptions.getChunkSize

    this.#file = file
    this.#onSuccess = this.options.onSuccess

    this.#initChunks()
  }

  #initChunks () {
    const desiredChunkSize = this.options.getChunkSize(this.#file)
    // at least 5MB per request, at most 10k requests
    const fileSize = this.#file.size
    const minChunkSize = Math.max(5 * MB, Math.ceil(fileSize / 10000))
    const chunkSize = Math.max(desiredChunkSize, minChunkSize)

    // Upload zero-sized files in one zero-sized chunk
    if (this.#file.size === 0) {
      this.#chunks = [this.#file]
    } else {
      const arraySize = Math.ceil(fileSize / chunkSize)
      this.#chunks = Array(arraySize)
      let j = 0
      for (let i = 0; i < fileSize; i += chunkSize) {
        const end = Math.min(fileSize, i + chunkSize)
        const chunk = this.#file.slice(i, end)
        chunk.onProgress = this.#onPartProgress(j)
        chunk.onComplete = this.#onPartComplete(j)
        this.#chunks[j++] = chunk
      }
    }

    this.#chunkState = Array.from(this.#chunks, () => ({ uploaded:0 }))
  }

  #createUpload () {
    this.#uploadPromise = this
      .options.companionComm.uploadFile(this.#file, this.#chunks, this.#abortController.signal)
      .then(this.#onSuccess, this.#onReject)
  }

  async #resumeUpload () {
    this.#uploadPromise = this
      .options.companionComm.resumeUploadFile(this.#file, this.#chunks, this.#abortController.signal)
      .then(this.#onSuccess, this.#onReject)
  }

  #onPartProgress = (index) => (ev) => {
    if (!ev.lengthComputable) return

    const sent = ev.loaded
    this.#chunkState[index].uploaded = ensureInt(sent)

    const totalUploaded = this.#chunkState.reduce((n, c) => n + c.uploaded, 0)
    this.options.onProgress(totalUploaded, this.#file.size)
  }

  #onPartComplete = (index) => (etag) => {
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
    this.options.companionComm.abortFileUpload(this.#file).catch(console.warn)
  }

  #onError (err) {
    if (err && err.name === 'AbortError') {
      return
    }

    this.options.onError(err)
  }

  start () {
    this.#isPaused = false
    if (this.#uploadPromise) {
      if (!this.#abortController.signal.aborted) this.#abortController.abort(new Error('restarting upload'))
      this.#abortController = new AbortController()
      this.#resumeUpload()
    } else {
      this.#createUpload()
    }
  }

  pause () {
    this.#abortController.abort()
    // Swap it out for a new controller, because this instance may be resumed later.
    this.#abortController = new AbortController()

    this.#isPaused = true
  }

  abort (opts = undefined) {
    if (opts?.really) this.#abortUpload()
    else this.pause()
  }
}

export default MultipartUploader
