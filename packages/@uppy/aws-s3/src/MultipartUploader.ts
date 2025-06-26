import type { Uppy } from '@uppy/core'
import { AbortController } from '@uppy/utils/lib/AbortController'
import type { Body, Meta, UppyFile } from '@uppy/utils/lib/UppyFile'
import type { HTTPCommunicationQueue } from './HTTPCommunicationQueue.js'

const MB = 1024 * 1024

interface MultipartUploaderOptions<M extends Meta, B extends Body> {
  getChunkSize?: (file: { size: number }) => number
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void
  onPartComplete?: (part: { PartNumber: number; ETag: string }) => void
  shouldUseMultipart?: boolean | ((file: UppyFile<M, B>) => boolean)
  onSuccess?: (result: B) => void
  onError?: (err: unknown) => void
  companionComm: HTTPCommunicationQueue<M, B>
  file: UppyFile<M, B>
  log: Uppy<M, B>['log']

  uploadId?: string
  key: string
}

const defaultOptions = {
  getChunkSize(file: { size: number }) {
    return Math.ceil(file.size / 10000)
  },
  onProgress() {},
  onPartComplete() {},
  onSuccess() {},
  onError(err: unknown) {
    throw err
  },
} satisfies Partial<MultipartUploaderOptions<any, any>>

export interface Chunk {
  getData: () => Blob
  onProgress: (ev: ProgressEvent) => void
  onComplete: (etag: string) => void
  shouldUseMultipart: boolean
  setAsUploaded?: () => void
}

function ensureInt<T>(value: T): T extends number | string ? number : never {
  if (typeof value === 'string') {
    // @ts-expect-error TS is not able to recognize it's fine.
    return parseInt(value, 10)
  }
  if (typeof value === 'number') {
    // @ts-expect-error TS is not able to recognize it's fine.
    return value
  }
  throw new TypeError('Expected a number')
}

export const pausingUploadReason = Symbol('pausing upload, not an actual error')

/**
 * A MultipartUploader instance is used per file upload to determine whether a
 * upload should be done as multipart or as a regular S3 upload
 * (based on the user-provided `shouldUseMultipart` option value) and to manage
 * the chunk splitting.
 */
class MultipartUploader<M extends Meta, B extends Body> {
  options: MultipartUploaderOptions<M, B> &
    Required<Pick<MultipartUploaderOptions<M, B>, keyof typeof defaultOptions>>

  #abortController = new AbortController()

  #chunks: Array<Chunk | null> = []

  #chunkState: { uploaded: number; etag?: string; done?: boolean }[] = []

  /**
   * The (un-chunked) data to upload.
   */
  #data: Blob

  #file: UppyFile<M, B>

  #uploadHasStarted = false

  #onError: (err: unknown) => void

  #onSuccess: (result: B) => void

  #shouldUseMultipart: MultipartUploaderOptions<M, B>['shouldUseMultipart']

  #isRestoring: boolean

  #onReject = (err: unknown) =>
    (err as any)?.cause === pausingUploadReason ? null : this.#onError(err)

  #maxMultipartParts = 10_000

  #minPartSize = 5 * MB

  constructor(data: Blob, options: MultipartUploaderOptions<M, B>) {
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

    // When we are restoring an upload, we already have an UploadId and a Key. Otherwise
    // we need to call `createMultipartUpload` to get an `uploadId` and a `key`.
    // Non-multipart uploads are not restorable.
    this.#isRestoring = (options.uploadId && options.key) as any as boolean

    this.#initChunks()
  }

  // initChunks checks the user preference for using multipart uploads (opts.shouldUseMultipart)
  // and calculates the optimal part size. When using multipart part uploads every part except for the last has
  // to be at least 5 MB and there can be no more than 10K parts.
  // This means we sometimes need to change the preferred part size from the user in order to meet these requirements.
  #initChunks() {
    const fileSize = this.#data.size
    const shouldUseMultipart =
      typeof this.#shouldUseMultipart === 'function'
        ? this.#shouldUseMultipart(this.#file)
        : Boolean(this.#shouldUseMultipart)

    if (shouldUseMultipart && fileSize > this.#minPartSize) {
      // At least 5MB per request:
      let chunkSize = Math.max(
        this.options.getChunkSize(this.#data) as number, // Math.max can take undefined but TS does not think so
        this.#minPartSize,
      )
      let arraySize = Math.floor(fileSize / chunkSize)

      // At most 10k requests per file:
      if (arraySize > this.#maxMultipartParts) {
        arraySize = this.#maxMultipartParts
        chunkSize = fileSize / this.#maxMultipartParts
      }
      this.#chunks = Array(arraySize)

      for (let offset = 0, j = 0; offset < fileSize; offset += chunkSize, j++) {
        const end = Math.min(fileSize, offset + chunkSize)

        // Defer data fetching/slicing until we actually need the data, because it's slow if we have a lot of files
        const getData = () => {
          const i2 = offset
          return this.#data.slice(i2, end)
        }

        this.#chunks[j] = {
          getData,
          onProgress: this.#onPartProgress(j),
          onComplete: this.#onPartComplete(j),
          shouldUseMultipart,
        }
        if (this.#isRestoring) {
          const size =
            offset + chunkSize > fileSize ? fileSize - offset : chunkSize
          // setAsUploaded is called by listPart, to keep up-to-date the
          // quantity of data that is left to actually upload.
          this.#chunks[j]!.setAsUploaded = () => {
            this.#chunks[j] = null
            this.#chunkState[j].uploaded = size
          }
        }
      }
    } else {
      this.#chunks = [
        {
          getData: () => this.#data,
          onProgress: this.#onPartProgress(0),
          onComplete: this.#onPartComplete(0),
          shouldUseMultipart,
        },
      ]
    }

    this.#chunkState = this.#chunks.map(() => ({ uploaded: 0 }))
  }

  #createUpload() {
    this.options.companionComm
      .uploadFile(
        this.#file,
        this.#chunks as Chunk[],
        this.#abortController.signal,
      )
      .then(this.#onSuccess, this.#onReject)
    this.#uploadHasStarted = true
  }

  #resumeUpload() {
    this.options.companionComm
      .resumeUploadFile(this.#file, this.#chunks, this.#abortController.signal)
      .then(this.#onSuccess, this.#onReject)
  }

  #onPartProgress = (index: number) => (ev: ProgressEvent) => {
    if (!ev.lengthComputable) return

    this.#chunkState[index].uploaded = ensureInt(ev.loaded)

    const totalUploaded = this.#chunkState.reduce((n, c) => n + c.uploaded, 0)
    this.options.onProgress(totalUploaded, this.#data.size)
  }

  #onPartComplete = (index: number) => (etag: string) => {
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

  #abortUpload() {
    this.#abortController.abort()
    this.options.companionComm
      .abortFileUpload(this.#file)
      .catch((err: unknown) => this.options.log(err as Error))
  }

  start(): void {
    if (this.#uploadHasStarted) {
      if (!this.#abortController.signal.aborted)
        this.#abortController.abort(pausingUploadReason)
      this.#abortController = new AbortController()
      this.#resumeUpload()
    } else if (this.#isRestoring) {
      this.options.companionComm.restoreUploadFile(this.#file, {
        uploadId: this.options.uploadId,
        key: this.options.key,
      })
      this.#resumeUpload()
    } else {
      this.#createUpload()
    }
  }

  pause(): void {
    this.#abortController.abort(pausingUploadReason)
    // Swap it out for a new controller, because this instance may be resumed later.
    this.#abortController = new AbortController()
  }

  abort(opts?: { really?: boolean }): void {
    if (opts?.really) this.#abortUpload()
    else this.pause()
  }

  private [Symbol.for('uppy test: getChunkState')]() {
    return this.#chunkState
  }
}

export default MultipartUploader
