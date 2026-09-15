import { EventManager, type Uppy } from '@uppy/core'
import type { Body, LocalUppyFile, Meta, TaskQueue } from '@uppy/core/utils'
import type S3Client from './s3-client/S3Client.js'

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
  s3Client: S3Client
  queue: TaskQueue
  file: LocalUppyFile<M, B>
  metadata: Record<string, unknown>
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
  #key: string | undefined
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
        this.#pause()
      } else {
        this.start()
      }
    })

    this.#eventManager.onPauseAll(fileId, () => {
      this.#pause()
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

  /**
   * Run one S3 request through the shared queue. Dropped if the upload is
   * aborted while queued; frees its slot on abort even when the work itself
   * (e.g. a hung signRequest) never settles.
   */
  #queued<T>(signal: AbortSignal, task: () => Promise<T>): Promise<T> {
    signal.throwIfAborted()
    return this.#options.queue
      .add(async () => {
        signal.throwIfAborted()
        let onAbort!: () => void
        const aborted = new Promise<never>((_, reject) => {
          onAbort = () =>
            reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
          signal.addEventListener('abort', onAbort, { once: true })
        })
        try {
          return await Promise.race([task(), aborted])
        } finally {
          signal.removeEventListener('abort', onAbort)
        }
      })
      .abortOn(signal)
  }

  async start(): Promise<void> {
    // Abort any pending operations (if not already aborted)
    this.#abortController?.abort()
    // Always create a fresh AbortController (also for resume)
    const controller = new AbortController()
    this.#abortController = controller
    const { signal } = controller

    try {
      const uploadId = this.#uploadId
      if (this.#uploadHasStarted && uploadId) {
        await this.#resumeMultipartUpload(uploadId, signal)
      } else {
        this.#uploadHasStarted = true
        if (this.#shouldUseMultipart) {
          await this.#uploadMultipart(signal)
        } else {
          await this.#uploadNonMultipart(signal)
        }
      }
    } catch (err) {
      // Stop this attempt's sibling requests. A newer start() owns a different
      // controller, so a late failure here cannot abort it.
      controller.abort()
      this.#onError(err instanceof Error ? err : new Error(err))
    }
  }

  #pause(): void {
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
      if (!this.#key) {
        throw new Error('Missing S3 object key for aborting upload')
      }
      this.#options.s3Client
        .abortMultipartUpload({ key: this.#key, uploadId: this.#uploadId })
        .catch((abortErr) => {
          this.#options.log?.(abortErr, 'warning')
        })
    }

    this.#key = undefined
    this.#uploadId = undefined
    this.#uploadHasStarted = false
  }

  async #resumeMultipartUpload(
    uploadId: string,
    signal: AbortSignal,
  ): Promise<void> {
    if (!this.#key) {
      throw new Error('Missing S3 object key for resuming upload')
    }
    const key = this.#key
    const existingParts = await this.#queued(signal, () =>
      this.#options.s3Client.listParts({ uploadId, key, signal }),
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
    await this.#uploadRemainingParts(signal)
  }

  async #uploadNonMultipart(signal: AbortSignal): Promise<void> {
    const { location, key } = await this.#queued(signal, () =>
      this.#options.s3Client.putObject({
        key: this.#options.key,
        data: this.#data,
        fileType: this.#options.file.type || 'application/octet-stream',
        metadata: this.#options.metadata,
        onProgress: (bytesUploaded: number) => {
          this.#chunkState[0].uploaded = bytesUploaded
          this.#onProgress()
        },
        signal,
      }),
    )

    this.#onSuccess({
      location,
      key,
    })
  }

  async #uploadMultipart(signal: AbortSignal): Promise<void> {
    await this.#queued(signal, async () => {
      const { uploadId, key } =
        await this.#options.s3Client.createMultipartUpload({
          key: this.#options.key,
          fileType: this.#options.file.type || 'application/octet-stream',
          metadata: this.#options.metadata,
          signal,
        })

      // Recorded inside the task: an abort landing between S3's response and
      // the queue settling would otherwise drop the uploadId and orphan the
      // upload in S3.
      this.#key = key // Note: may differ from this.#options.key
      this.#uploadId = uploadId

      // Persist resume state so Golden Retriever can restore it after page refresh
      this.#options.uppy.setFileState(this.#options.file.id, {
        s3Multipart: { uploadId, key },
      })
    })

    await this.#uploadRemainingParts(signal)
  }

  async #uploadRemainingParts(signal: AbortSignal): Promise<void> {
    const key = this.#key
    const uploadId = this.#uploadId
    if (key == null || uploadId == null) {
      throw new Error('Missing S3 object key or uploadId for uploading parts')
    }

    await Promise.all(
      this.#chunks
        .filter((chunk) => !this.#chunkState[chunk.index].etag)
        .map((chunk) =>
          this.#queued(signal, async () => {
            const { etag } = await this.#options.s3Client.uploadPart({
              key,
              uploadId,
              // Sliced here, not up front, so only admitted parts exist.
              data: this.#data.slice(chunk.start, chunk.end),
              partNumber: chunk.index + 1,
              onProgress: (bytesUploaded: number) => {
                this.#chunkState[chunk.index].uploaded = bytesUploaded
                this.#onProgress()
              },
              signal,
            })

            this.#chunkState[chunk.index] = { uploaded: chunk.size, etag }
            this.#onProgress()
            this.#options.onPartComplete?.({
              PartNumber: chunk.index + 1,
              ETag: etag,
            })
          }),
        ),
    )

    const parts = this.#chunkState.flatMap((state, i) =>
      state.etag ? [{ partNumber: i + 1, etag: state.etag }] : [],
    )

    // Not queued: it is a tiny request, and queueing it would park this file's
    // success behind every part other files enqueued in the meantime.
    const { location, key: completedKey } =
      await this.#options.s3Client.completeMultipartUpload({
        key,
        uploadId,
        parts,
        signal,
      })

    this.#onSuccess({
      location,
      key: completedKey,
      uploadId,
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

    // Clear persisted resume state — upload completed successfully.
    this.#options.uppy.setFileState(this.#options.file.id, {
      s3Multipart: undefined,
    })
    this.#options.onSuccess?.(result)
  }

  #onError(err: Error): void {
    // ignore abort signals from intentional cancellation
    if (err.name === 'AbortError') return

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
