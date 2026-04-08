import { EventManager, type Uppy } from '@uppy/core'
import type { Body, LocalUppyFile, Meta } from '@uppy/utils'
import type S3mini from './s3-client/S3.js'

/** Persisted S3 multipart state for Golden Retriever resume support */
interface S3MultipartState {
  uploadId: string
  key: string
}

declare module '@uppy/utils' {
  // biome-ignore lint/correctness/noUnusedVariables: must match existing interface signature
  export interface LocalUppyFile<M extends Meta, B extends Body> {
    s3Multipart?: S3MultipartState
  }
  // biome-ignore lint/correctness/noUnusedVariables: must match existing interface signature
  export interface RemoteUppyFile<M extends Meta, B extends Body> {
    s3Multipart?: S3MultipartState
  }
}

// ============================================================================
// Constants
// ============================================================================

const MB = 1024 * 1024

/** Minimum chunk size required by S3 (5MB) */
const MIN_CHUNK_SIZE = 5 * MB

/** Maximum number of parts allowed by S3 */
const MAX_PARTS = 10000

// ============================================================================
// S3Uploader Types
// ============================================================================

interface S3UploaderOptions<M extends Meta, B extends Body> {
  uppy: Uppy<M, B>
  s3Client: S3mini
  file: LocalUppyFile<M, B>
  key: string
  shouldUseMultipart?: boolean
  getChunkSize?: (file: { size: number }) => number
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void
  onPartComplete?: (part: { PartNumber: number; ETag: string }) => void
  onSuccess?: (result: UploadResult) => void
  onError?: (err: Error) => void
  onAbort?: () => void
  log?: Uppy['log']
}

export interface UploadResult {
  location: string
  key: string
  /** Only returned for multipart uploads */
  uploadId?: string
}

interface Chunk {
  index: number
  start: number
  end: number
  size: number
}

interface ChunkState {
  uploaded: number
  etag?: string
}

export default class S3Uploader<M extends Meta, B extends Body> {
  readonly #data: NonNullable<LocalUppyFile<M, B>['data']>
  readonly #key: string
  readonly #options: S3UploaderOptions<M, B>
  readonly #eventManager: EventManager<M, B>

  #chunks: Chunk[] = []
  #chunkState: ChunkState[] = []
  #shouldUseMultipart: boolean = false
  #uploadId?: string
  #uploadHasStarted: boolean = false
  #abortController: AbortController | undefined

  constructor(options: S3UploaderOptions<M, B>) {
    if (options.file.data == null) {
      throw new Error(`File data is missing for file ${options.file.id}`)
    }
    this.#options = options
    this.#data = options.file.data
    this.#key = options.key
    this.#eventManager = new EventManager(options.uppy)

    // Detect resume state from file (persisted by Golden Retriever across page refreshes).
    // Must run before #initChunks so it can force multipart mode for resumed uploads.
    const resumeState = options.file.s3Multipart
    if (resumeState) {
      this.#key = resumeState.key
      this.#uploadId = resumeState.uploadId
      this.#uploadHasStarted = true
    }

    const fileSize = options.file.data.size

    // Determine if we should use multipart
    // If we're resuming a multipart upload, force multipart. Otherwise use
    // the boolean option (true/false) and ensure the file is larger than
    // S3's minimum chunk size when enabling multipart.
    this.#shouldUseMultipart =
      Boolean(resumeState) ||
      (this.#options.shouldUseMultipart === true && fileSize > MIN_CHUNK_SIZE)

    // Create chunks based on upload strategy
    if (this.#shouldUseMultipart) {
      // Calculate chunk size: at least MIN_CHUNK_SIZE, but may be larger for huge files
      let chunkSize = this.#getChunkSize(fileSize)
      chunkSize = Math.max(chunkSize, MIN_CHUNK_SIZE)

      // Ensure we don't exceed MAX_PARTS (S3 limit: 10,000 parts)
      if (Math.ceil(fileSize / chunkSize) > MAX_PARTS) {
        chunkSize = Math.ceil(fileSize / MAX_PARTS)
      }

      // Create chunk definitions
      for (
        let offset = 0, index = 0;
        offset < fileSize;
        offset += chunkSize, index++
      ) {
        const end = Math.min(offset + chunkSize, fileSize)
        this.#chunks.push({ index, start: offset, end, size: end - offset })
      }
    } else {
      // Simple upload: single chunk for the entire file
      this.#chunks = [{ index: 0, start: 0, end: fileSize, size: fileSize }]
    }

    this.#chunkState = this.#chunks.map(() => ({ uploaded: 0 }))

    // Setup events:
    const fileId = this.#options.file.id

    this.#eventManager.onFileRemove(fileId, () => {
      this.abort()
      this.#options.onAbort?.()
    })

    this.#eventManager.onCancelAll(fileId, () => {
      this.abort()
      this.#options.onAbort?.()
    })

    this.#eventManager.onFilePause(fileId, (isPaused) => {
      if (isPaused) {
        this.pause()
      } else {
        this.start()
      }
    })

    this.#eventManager.onPauseAll(fileId, () => {
      this.pause()
    })

    this.#eventManager.onResumeAll(fileId, () => {
      this.start()
    })

    this.#eventManager.onRetry(fileId, () => {
      this.start()
    })

    this.#eventManager.onRetryAll(fileId, () => {
      this.start()
    })
  }

  #getChunkSize(fileSize: number): number {
    if (this.#options.getChunkSize) {
      return this.#options.getChunkSize({ size: fileSize })
    }
    return Math.ceil(fileSize / MAX_PARTS)
  }

  async start(): Promise<void> {
    // Abort any pending operations (if not already aborted)
    this.#abortController?.abort()
    // Always create a fresh AbortController (also for resume)
    this.#abortController = new AbortController()

    try {
      if (this.#uploadHasStarted) {
        await this.#resumeUpload()
      } else {
        await this.#createUpload()
      }
    } catch (err) {
      this.#onError(err as Error)
    }
  }

  pause(): void {
    this.#abortController?.abort()
  }

  /**
   *
   * @param opts - `abortInS3`: Whether to also abort the multipart upload in S3. Default: true. Set to false to keep the multipart upload in S3 active, allowing for manual cleanup later and preventing accidental data loss if the user later tries to resume the upload.
   */
  abort(opts?: { abortInS3?: boolean }): void {
    this.#abortController?.abort()
    // Clean up event listeners
    this.#eventManager.remove()
    if (opts?.abortInS3 !== false && this.#uploadId) {
      // Clear persisted resume state — the upload no longer exists in S3,
      // so retries must start fresh instead of attempting to resume.
      this.#options.uppy.setFileState(this.#options.file.id, {
        s3Multipart: undefined,
      })
      this.#options.s3Client
        .abortMultipartUpload(this.#key, this.#uploadId)
        .catch((abortErr) => {
          this.#options.log?.(abortErr, 'warning')
        })
    }
  }

  async #createUpload(): Promise<void> {
    this.#uploadHasStarted = true
    if (this.#shouldUseMultipart) {
      await this.#uploadMultipart()
    } else {
      await this.#uploadNonMultipart()
    }
  }

  async #resumeUpload(): Promise<void> {
    if (!this.#uploadId) {
      await this.#createUpload()
      return
    }
    const existingParts = await this.#options.s3Client.listParts(
      this.#uploadId,
      this.#key,
    )
    // Sync local state with S3 - mark already-uploaded parts
    for (const part of existingParts) {
      const chunkIndex = part.partNumber - 1
      if (chunkIndex >= 0 && chunkIndex < this.#chunkState.length) {
        this.#chunkState[chunkIndex].uploaded = this.#chunks[chunkIndex].size
        this.#chunkState[chunkIndex].etag = part.etag
      }
    }
    // Emit progress update to reflect already-uploaded parts
    this.#onProgress()
    await this.#uploadRemainingParts()
  }

  async #uploadNonMultipart(): Promise<void> {
    const signal = this.#abortController?.signal
    signal?.throwIfAborted()

    const { location } = await this.#options.s3Client.putObject(
      this.#key,
      this.#data,
      this.#options.file.type || 'application/octet-stream',
      (bytesUploaded: number) => {
        this.#chunkState[0].uploaded = bytesUploaded
        this.#onProgress()
      },
      signal,
    )

    this.#onSuccess({
      location,
      key: this.#key,
    })
  }

  async #uploadMultipart(): Promise<void> {
    const signal = this.#abortController?.signal
    signal?.throwIfAborted()

    const { uploadId } = await this.#options.s3Client.createMultipartUpload(
      this.#key,
      this.#options.file.type || 'application/octet-stream',
    )

    // Persist resume state so Golden Retriever can restore it after page refresh
    this.#options.uppy.setFileState(this.#options.file.id, {
      s3Multipart: { uploadId, key: this.#key },
    })

    this.#uploadId = uploadId

    await this.#uploadRemainingParts()
  }

  async #uploadRemainingParts(): Promise<void> {
    const signal = this.#abortController?.signal

    for (let i = 0; i < this.#chunks.length; i++) {
      signal?.throwIfAborted()
      if (this.#chunkState[i].etag) continue // already uploaded

      const chunk = this.#chunks[i]
      const partNumber = i + 1
      const chunkData = this.#data.slice(chunk.start, chunk.end)
      const chunkIndex = i // Capture for closure (cannot use for-loop variable i directly in a closure)

      const { etag } = await this.#options.s3Client.uploadPart(
        this.#key,
        this.#uploadId!,
        chunkData,
        partNumber,
        (bytesUploaded: number) => {
          this.#chunkState[chunkIndex].uploaded = bytesUploaded
          this.#onProgress()
        },
        signal,
      )

      // after part finished uploading, update chunk state
      this.#chunkState[i].uploaded = chunk.size
      this.#chunkState[i].etag = etag
      this.#onProgress()

      if (this.#options.onPartComplete) {
        this.#options.onPartComplete({
          PartNumber: partNumber,
          ETag: etag,
        })
      }
    }

    signal?.throwIfAborted()

    const parts = this.#chunkState.flatMap((state, i) =>
      state.etag ? [{ partNumber: i + 1, etag: state.etag }] : [],
    )

    const { location, key } =
      await this.#options.s3Client.completeMultipartUpload(
        this.#key,
        this.#uploadId!,
        parts,
      )

    this.#onSuccess({
      location,
      key,
      uploadId: this.#uploadId,
    })
  }

  #onProgress(): void {
    if (!this.#options.onProgress) return
    const bytesUploaded = this.#chunkState.reduce(
      (sum, state) => sum + state.uploaded,
      0,
    )
    this.#options.onProgress(bytesUploaded, this.#data.size)
  }

  #onSuccess(result: UploadResult): void {
    // If the upload was aborted (file removed mid-upload), the network request
    // may still complete successfully. Don't emit success in this case since
    // the file no longer exists in Uppy's state.
    this.#eventManager.remove()
    if (this.#abortController?.signal.aborted) {
      return
    }
    // Clear persisted resume state — upload completed successfully.
    this.#options.uppy.setFileState(this.#options.file.id, {
      s3Multipart: undefined,
    })
    this.#options.onSuccess?.(result)
  }

  #onError(err: Error): void {
    // ignore abort signals from intentional cancellation
    if (err.name === 'AbortError') return
    // If we intentionally aborted, don't report any subsequent errors
    // (e.g., S3 returning 404 NoSuchUpload after we aborted the upload)
    if (this.#abortController?.signal.aborted) return

    // Clean up event listeners so this uploader doesn't become a "zombie"
    // that reacts to future retry/pause/resume events after the error.
    // Without this, each failed retry leaves an orphaned uploader that
    // still listens for retry-all, causing duplicate uploads on the next
    // successful retry.
    this.#eventManager.remove()

    // NOTE: We intentionally do NOT abort the multipart upload in S3 here.
    // This allows the user to retry and resume from where they left off.
    // The multipart upload is only aborted when the user cancels via the
    // `abort()` method. By default `abort()` will also abort the multipart
    // upload in S3 (abortInS3 = true). Pass { abortInS3: false } to keep the
    // multipart upload in S3 so it can be cleaned up manually or resumed later.

    this.#options.onError?.(err)
  }
}
