/**
 * MultipartUploader - Orchestrates S3 uploads using S3mini
 *
 * Decides between simple (putObject) and multipart uploads based on file size.
 * Handles chunking, progress tracking, and abort.
 */

import type { Body, Meta, UppyFile } from '@uppy/utils'
import { AbortController } from '@uppy/utils'
import type S3mini from './s3-client/S3.js'
import type * as IT from './s3-client/types.js'

// ============================================================================
// Constants
// ============================================================================

const MB = 1024 * 1024

/** Minimum chunk size required by S3 (5MB) */
const MIN_CHUNK_SIZE = 5 * MB

/** Maximum number of parts allowed by S3 */
const MAX_PARTS = 10000

// ============================================================================
// Types
// ============================================================================

export interface MultipartUploaderOptions<M extends Meta, B extends Body> {
  /** S3mini client instance */
  s3Client: S3mini

  /** The Uppy file object */
  file: UppyFile<M, B>

  /** S3 object key */
  key: string

  /**
   * Whether to use multipart upload.
   * - `true`: Always use multipart
   * - `false`: Always use simple PUT
   * - Default: Based on chunk count
   */
  shouldUseMultipart?: boolean

  /** Custom chunk size function */
  getChunkSize?: (file: { size: number }) => number

  // Callbacks
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void
  onPartComplete?: (part: { PartNumber: number; ETag: string }) => void
  onSuccess?: (result: UploadResult) => void
  onError?: (err: Error) => void
}

export interface UploadResult {
  location: string
  key: string
  bucket?: string
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

// ============================================================================
// Reason for pausing (not a real error)
// ============================================================================

export const pausingUploadReason = Symbol('pausing upload, not an actual error')

// ============================================================================
// MultipartUploader Class
// ============================================================================

export class MultipartUploader<M extends Meta, B extends Body> {
  readonly #s3Client: S3mini
  readonly #file: UppyFile<M, B>
  readonly #data: Blob
  readonly #key: string
  readonly #options: MultipartUploaderOptions<M, B>

  #chunks: Chunk[] = []
  #chunkState: ChunkState[] = []
  #shouldUseMultipart: boolean = false
  #uploadId?: string
  #uploadHasStarted: boolean = false
  #abortController: AbortController = new AbortController()

  constructor(data: Blob, options: MultipartUploaderOptions<M, B>) {
    this.#s3Client = options.s3Client
    this.#file = options.file
    this.#data = data
    this.#key = options.key
    this.#options = options

    this.#initChunks()
  }

  // --------------------------------------------------------------------------
  // Chunk Initialization
  // --------------------------------------------------------------------------

  #initChunks(): void {
    const fileSize = this.#data.size

    // Determine if multipart should be used
    if (typeof this.#options.shouldUseMultipart === 'boolean') {
      this.#shouldUseMultipart = this.#options.shouldUseMultipart
    } else {
      // Default: use multipart for files that would have multiple chunks
      const chunkSize = this.#getChunkSize(fileSize)
      this.#shouldUseMultipart = fileSize > chunkSize
    }

    if (this.#shouldUseMultipart && fileSize > MIN_CHUNK_SIZE) {
      // Multipart: create multiple chunks
      let chunkSize = this.#getChunkSize(fileSize)

      // Ensure minimum chunk size
      chunkSize = Math.max(chunkSize, MIN_CHUNK_SIZE)

      // Ensure we don't exceed max parts
      if (Math.ceil(fileSize / chunkSize) > MAX_PARTS) {
        chunkSize = Math.ceil(fileSize / MAX_PARTS)
      }

      // Create chunk definitions
      let offset = 0
      let index = 0
      while (offset < fileSize) {
        const end = Math.min(offset + chunkSize, fileSize)
        this.#chunks.push({
          index,
          start: offset,
          end,
          size: end - offset,
        })
        offset = end
        index++
      }
    } else {
      // Non-multipart: single chunk for entire file
      this.#chunks = [
        {
          index: 0,
          start: 0,
          end: fileSize,
          size: fileSize,
        },
      ]
      this.#shouldUseMultipart = false
    }

    // Initialize chunk state
    this.#chunkState = this.#chunks.map(() => ({ uploaded: 0 }))
  }

  #getChunkSize(fileSize: number): number {
    if (this.#options.getChunkSize) {
      return this.#options.getChunkSize({ size: fileSize })
    }
    // Default: 5MB minimum, scaled up for very large files
    return Math.max(MIN_CHUNK_SIZE, Math.ceil(fileSize / MAX_PARTS))
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Starts or resumes the upload.
   */
  start(): void {
    if (this.#uploadHasStarted) {
      // Resume: abort current controller and create new one
      this.#abortController.abort(pausingUploadReason)
      this.#abortController = new AbortController()
      this.#resumeUpload()
    } else {
      this.#createUpload()
    }
  }

  /**
   * Pauses the upload.
   */
  pause(): void {
    this.#abortController.abort(pausingUploadReason)
  }

  /**
   * Aborts the upload and cleans up.
   */
  abort(opts?: { really?: boolean }): void {
    this.#abortController.abort()

    // If we have an upload ID, abort the multipart upload on S3
    if (opts?.really !== false && this.#uploadId) {
      this.#s3Client
        .abortMultipartUpload(this.#key, this.#uploadId)
        .catch(() => {
          // Ignore abort errors
        })
    }
  }

  // --------------------------------------------------------------------------
  // Upload Orchestration
  // --------------------------------------------------------------------------

  async #createUpload(): Promise<void> {
    this.#uploadHasStarted = true

    try {
      if (this.#shouldUseMultipart) {
        await this.#multipartUpload()
      } else {
        await this.#simpleUpload()
      }
    } catch (err) {
      this.#onError(err as Error)
    }
  }

  async #resumeUpload(): Promise<void> {
    if (!this.#uploadId) {
      // No upload ID means we haven't started multipart yet
      await this.#createUpload()
      return
    }

    try {
      // List existing parts
      const existingParts = await this.#s3Client.listParts(
        this.#uploadId,
        this.#key,
      )

      // Mark uploaded chunks
      for (const part of existingParts) {
        const chunkIndex = part.partNumber - 1
        if (chunkIndex >= 0 && chunkIndex < this.#chunkState.length) {
          this.#chunkState[chunkIndex].uploaded = this.#chunks[chunkIndex].size
          this.#chunkState[chunkIndex].etag = part.etag
        }
      }

      // Continue with remaining chunks
      await this.#uploadRemainingParts()
    } catch (err) {
      this.#onError(err as Error)
    }
  }

  // --------------------------------------------------------------------------
  // Simple (Non-Multipart) Upload
  // --------------------------------------------------------------------------

  async #simpleUpload(): Promise<void> {
    const signal = this.#abortController.signal

    if (signal.aborted) {
      throw new Error('Upload aborted')
    }

    await this.#s3Client.putObject(
      this.#key,
      this.#data,
      this.#file.type || 'application/octet-stream',
    )

    // Report progress
    this.#chunkState[0].uploaded = this.#data.size
    this.#onProgress()

    // Success
    this.#onSuccess({
      location: `${this.#s3Client.endpoint}/${this.#key}`,
      key: this.#key,
    })
  }

  // --------------------------------------------------------------------------
  // Multipart Upload
  // --------------------------------------------------------------------------

  async #multipartUpload(): Promise<void> {
    const signal = this.#abortController.signal

    if (signal.aborted) {
      throw new Error('Upload aborted')
    }

    // Step 1: Create multipart upload
    this.#uploadId = await this.#s3Client.getMultipartUploadId(
      this.#key,
      this.#file.type || 'application/octet-stream',
    )

    // Step 2: Upload all parts
    await this.#uploadRemainingParts()
  }

  async #uploadRemainingParts(): Promise<void> {
    const signal = this.#abortController.signal
    const parts: Array<{ partNumber: number; etag: string }> = []

    // Collect already uploaded parts
    for (let i = 0; i < this.#chunkState.length; i++) {
      if (this.#chunkState[i].etag) {
        parts.push({
          partNumber: i + 1,
          etag: this.#chunkState[i].etag!,
        })
      }
    }

    // Upload remaining parts sequentially
    for (let i = 0; i < this.#chunks.length; i++) {
      if (signal.aborted) {
        throw new Error('Upload aborted')
      }

      // Skip already uploaded chunks
      if (this.#chunkState[i].etag) {
        continue
      }

      const chunk = this.#chunks[i]
      const partNumber = i + 1
      const chunkData = this.#data.slice(chunk.start, chunk.end)

      const part = await this.#s3Client.uploadPart(
        this.#key,
        this.#uploadId!,
        chunkData,
        partNumber,
      )

      // Update state
      this.#chunkState[i].uploaded = chunk.size
      this.#chunkState[i].etag = part.etag
      parts.push({ partNumber: part.partNumber, etag: part.etag })

      // Report progress
      this.#onProgress()

      // Emit part complete
      if (this.#options.onPartComplete) {
        this.#options.onPartComplete({
          PartNumber: part.partNumber,
          ETag: part.etag,
        })
      }
    }

    // Step 3: Complete multipart upload
    if (signal.aborted) {
      throw new Error('Upload aborted')
    }

    const result = await this.#s3Client.completeMultipartUpload(
      this.#key,
      this.#uploadId!,
      parts,
    )

    // Success
    this.#onSuccess({
      location: result.location,
      key: result.key,
      bucket: result.bucket,
      uploadId: this.#uploadId,
    })
  }

  // --------------------------------------------------------------------------
  // Callbacks
  // --------------------------------------------------------------------------

  #onProgress(): void {
    if (!this.#options.onProgress) return

    const bytesUploaded = this.#chunkState.reduce(
      (sum, state) => sum + state.uploaded,
      0,
    )
    const bytesTotal = this.#data.size

    this.#options.onProgress(bytesUploaded, bytesTotal)
  }

  #onSuccess(result: UploadResult): void {
    if (this.#options.onSuccess) {
      this.#options.onSuccess(result)
    }
  }

  #onError(err: Error): void {
    // Don't report pausing as an error
    if ((err as any).cause === pausingUploadReason) {
      return
    }

    // Abort multipart upload on error
    if (this.#uploadId) {
      this.#s3Client.abortMultipartUpload(this.#key, this.#uploadId).catch(() => {
        // Ignore abort errors
      })
    }

    if (this.#options.onError) {
      this.#options.onError(err)
    }
  }
}

export default MultipartUploader
