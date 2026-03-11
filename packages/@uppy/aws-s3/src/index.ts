import type { RequestClient } from '@uppy/companion-client'
import {
  BasePlugin,
  type DefinePluginOpts,
  EventManager,
  type PluginOpts,
  type Uppy,
} from '@uppy/core'
import type {
  Body,
  LocalUppyFile,
  Meta,
  RemoteUppyFile,
  UppyFile,
} from '@uppy/utils'
import {
  filterFilesToEmitUploadStarted,
  filterFilesToUpload,
  getAllowedMetaFields,
  TaskQueue,
} from '@uppy/utils'
import packageJson from '../package.json' with { type: 'json' }
import S3mini from './s3-client/S3.js'
import type * as IT from './s3-client/types.js'

// ============================================================================
// Types
// ============================================================================

/** Part information for multipart uploads */
export interface AwsS3Part {
  PartNumber?: number
  Size?: number
  ETag?: string
}

type PartUploadedCallback<M extends Meta, B extends Body> = (
  file: UppyFile<M, B>,
  part: { PartNumber: number; ETag: string },
) => void

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

declare module '@uppy/core' {
  export interface UppyEventMap<M extends Meta, B extends Body> {
    's3-multipart:part-uploaded': PartUploadedCallback<M, B>
  }
}

export interface AwsS3Options<M extends Meta, B extends Body>
  extends PluginOpts {
  bucket: string
  region?: string
  endpoint?: string

  /**
   * Custom function to sign requests.
   * Called with request details, should return signed headers.
   * Alternative to using Companion endpoint.
   */
  signRequest?: IT.signRequestFn

  /**
   * Function to retrieve temporary credentials for client-side signing.
   * When provided, S3mini handles signing internally using SigV4.
   * Alternative to signRequest or endpoint.
   */
  getCredentials?: IT.getCredentialsFn

  /**
   * Whether to use multipart uploads.
   * - `true`: Always use multipart
   * - `false`: Always use simple PUT
   * - `function`: Called with file, return true for multipart
   * Default: Use multipart for files > 100MB
   */
  shouldUseMultipart?: boolean | ((file: UppyFile<M, B>) => boolean)
  getChunkSize?: (file: { size: number }) => number
  allowedMetaFields?: string[] | boolean

  /**
   * Maximum number of files uploading concurrently.
   * Each file uploads its parts sequentially.
   *
   * Default: 6 — chosen to match the browser's HTTP/1.1 per-origin connection
   * limit. Most browsers allow 6 concurrent connections per host, so this
   * prevents queueing at the browser level while maximizing throughput.
   */
  limit?: number

  /**
   * Custom function to generate the S3 object key.
   * Default: `{randomId}-{filename}`
   */
  generateObjectKey?: (file: UppyFile<M, B>) => string
}

// ============================================================================
// Constants
// ============================================================================

const MB = 1024 * 1024

/** Minimum chunk size required by S3 (5MB) */
const MIN_CHUNK_SIZE = 5 * MB

/** Maximum number of parts allowed by S3 */
const MAX_PARTS = 10000

const defaultOptions = {
  shouldUseMultipart: (file: UppyFile<any, any>) => (file.size || 0) > 100 * MB,
  allowedMetaFields: true,
  // 6 matches browser HTTP/1.1 per-origin connection limit
  limit: 6,
} satisfies Partial<AwsS3Options<any, any>>

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

interface UploadResult {
  location: string
  key: string
  bucket?: string
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

// ============================================================================
// S3Uploader Class
// ============================================================================

class S3Uploader<M extends Meta, B extends Body> {
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

  start(): void {
    // Abort any pending operations (if not already aborted)
    this.#abortController?.abort()
    // Always create a fresh AbortController (also for resume)
    this.#abortController = new AbortController()

    if (this.#uploadHasStarted) {
      this.#resumeUpload()
    } else {
      this.#createUpload()
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
    try {
      if (this.#shouldUseMultipart) {
        await this.#uploadMultipart()
      } else {
        await this.#uploadNonMultipart()
      }
    } catch (err) {
      this.#onError(err as Error)
    }
  }

  async #resumeUpload(): Promise<void> {
    if (!this.#uploadId) {
      await this.#createUpload()
      return
    }
    try {
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
    } catch (err) {
      this.#onError(err as Error)
    }
  }

  async #uploadNonMultipart(): Promise<void> {
    const signal = this.#abortController?.signal
    signal?.throwIfAborted()

    await this.#options.s3Client.putObject(
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
      location: `${this.#options.s3Client.endpoint}/${this.#key}`,
      key: this.#key,
    })
  }

  async #uploadMultipart(): Promise<void> {
    const signal = this.#abortController?.signal
    signal?.throwIfAborted()

    this.#uploadId = await this.#options.s3Client.createMultipartUpload(
      this.#key,
      this.#options.file.type || 'application/octet-stream',
    )

    // Persist resume state so Golden Retriever can restore it after page refresh
    this.#options.uppy.setFileState(this.#options.file.id, {
      s3Multipart: { uploadId: this.#uploadId, key: this.#key },
    })

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

      const part = await this.#options.s3Client.uploadPart(
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
      this.#chunkState[i].etag = part.etag
      this.#onProgress()

      if (this.#options.onPartComplete) {
        this.#options.onPartComplete({
          PartNumber: part.partNumber,
          ETag: part.etag,
        })
      }
    }

    signal?.throwIfAborted()

    const parts = this.#chunkState.flatMap((state, i) =>
      state.etag ? [{ partNumber: i + 1, etag: state.etag }] : [],
    )

    const result = await this.#options.s3Client.completeMultipartUpload(
      this.#key,
      this.#uploadId!,
      parts,
    )

    this.#onSuccess({
      location: result.location,
      key: result.key,
      bucket: result.bucket,
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

    // NOTE: We intentionally do NOT abort the multipart upload in S3 here.
    // This allows the user to retry and resume from where they left off.
    // The multipart upload is only aborted when the user cancels via the
    // `abort()` method. By default `abort()` will also abort the multipart
    // upload in S3 (abortInS3 = true). Pass { abortInS3: false } to keep the
    // multipart upload in S3 so it can be cleaned up manually or resumed later.

    this.#options.onError?.(err)
  }
}

// ============================================================================
// Plugin Class
// ============================================================================

export default class AwsS3<M extends Meta, B extends Body> extends BasePlugin<
  DefinePluginOpts<AwsS3Options<M, B>, keyof typeof defaultOptions>,
  M,
  B
> {
  static VERSION = packageJson.version

  #s3Client!: S3mini
  #queue!: TaskQueue
  #uploaders: Record<string, S3Uploader<M, B> | null> = {}

  constructor(uppy: Uppy<M, B>, opts: AwsS3Options<M, B>) {
    super(uppy, { ...defaultOptions, ...opts })
    this.type = 'uploader'
    this.id = this.opts.id || 'AwsS3'
  }

  install(): void {
    this.#setResumableUploadsCapability(true)
    this.#initS3Client()
    this.#queue = new TaskQueue({ concurrency: this.opts.limit })
    this.uppy.addUploader(this.#upload)
    this.uppy.on('cancel-all', this.#handleCancelAll)
  }

  uninstall(): void {
    this.#setResumableUploadsCapability(false)
    this.uppy.removeUploader(this.#upload)
    this.uppy.off('cancel-all', this.#handleCancelAll)
    this.#queue.clear()
    // Abort and clean up any in-flight uploads
    for (const fileId of Object.keys(this.#uploaders)) {
      const uploader = this.#uploaders[fileId]
      if (uploader) {
        uploader.abort()
      }
    }
  }

  #setResumableUploadsCapability = (value: boolean): void => {
    const { capabilities } = this.uppy.getState()
    this.uppy.setState({
      capabilities: {
        ...capabilities,
        resumableUploads: value,
      },
    })
  }

  #handleCancelAll = (): void => {
    this.#setResumableUploadsCapability(true)
    this.#queue.clear()
  }

  // --------------------------------------------------------------------------
  // S3 Client Initialization
  // --------------------------------------------------------------------------

  #initS3Client(): void {
    const { endpoint, signRequest, getCredentials, bucket, region } = this.opts

    if (region == null) {
      throw new TypeError('AwsS3: `region` option is required')
    }

    const s3Endpoint = `https://${bucket}.s3.${region}.amazonaws.com`

    if (getCredentials != null) {
      // Mode: Temporary credentials (client-side signing)
      this.#s3Client = new S3mini({
        endpoint: s3Endpoint,
        getCredentials,
        region,
      })
    } else if (signRequest != null) {
      // Mode: Custom signing function
      this.#s3Client = new S3mini({
        endpoint: s3Endpoint,
        signRequest,
        region,
      })
    } else if (endpoint != null) {
      // Mode: Companion signing
      this.#s3Client = new S3mini({
        endpoint: s3Endpoint,
        signRequest: this.#createCompanionSigner(endpoint),
        region,
      })
    } else {
      throw new TypeError(
        'AwsS3: One of options `endpoint`, `signRequest`, or `getCredentials` is required',
      )
    }
  }

  /**
   * Creates a signing function that calls Companion's /s3/sign endpoint.
   */
  #createCompanionSigner(companionUrl: string): IT.signRequestFn {
    return async (request) => {
      const response = await fetch(`${companionUrl}/s3/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
      if (!response.ok) {
        throw new Error(`Failed to sign request: ${response.statusText}`)
      }
      return response.json()
    }
  }

  // --------------------------------------------------------------------------
  // Upload Entry Point
  // --------------------------------------------------------------------------

  #upload = async (fileIDs: string[]): Promise<void> => {
    if (fileIDs.length === 0) return

    const files = this.uppy.getFilesByIds(fileIDs)
    const filesToUpload = filterFilesToUpload(files)
    const filesToEmit = filterFilesToEmitUploadStarted(filesToUpload)

    this.uppy.emit('upload-start', filesToEmit)

    const promises = filesToUpload.map((file) => {
      if (file.isRemote) {
        // Remote uploads are queued internally by RequestClient.uploadRemoteFile()
        // via getQueue(), so no outer queue wrapping is needed here.
        return this.#uploadRemoteFile(file)
      }
      return this.#queue.add(async () => {
        // File may have been removed while waiting in the queue.
        // Unlike actively uploading files, queued files don't have an S3Uploader
        // instance yet, so there's no event listener to catch the removal.
        // Re-fetch the file to ensure it still exists before starting upload.
        const currentFile = this.uppy.getFile(file.id)
        if (!currentFile) {
          return
        }
        return this.#uploadLocalFile(currentFile as LocalUppyFile<M, B>) // assume it's still a local file since remote files aren't queued
      })
    })

    await Promise.allSettled(promises)
    // After the upload batch is done, restore resumable uploads capability.
    // It may have been set to false if there were remote files in this batch.
    this.#setResumableUploadsCapability(true)
  }

  // --------------------------------------------------------------------------
  // Local File Upload
  // --------------------------------------------------------------------------

  async #uploadLocalFile(file: LocalUppyFile<M, B>): Promise<void> {
    try {
      return await new Promise((resolve, reject) => {
        // Create uploader (events are wired internally).
        // S3Uploader detects resume state from file.s3Multipart internally.
        const uploader = new S3Uploader<M, B>({
          uppy: this.uppy,
          s3Client: this.#s3Client,
          file,
          key: this.#generateKey(file),
          shouldUseMultipart: this.#shouldUseMultipart(file),
          getChunkSize: this.opts.getChunkSize,
          log: (...args) => this.uppy.log(...args),

          onProgress: (bytesUploaded, bytesTotal) => {
            this.uppy.emit('upload-progress', file, {
              uploadStarted: file.progress.uploadStarted ?? Date.now(),
              bytesUploaded,
              bytesTotal,
            })
          },

          onPartComplete: (part) => {
            this.uppy.emit('s3-multipart:part-uploaded', file, part)
          },

          onSuccess: (result: UploadResult) => {
            this.uppy.emit('upload-success', file, {
              status: 200,
              body: {
                location: result.location,
                key: result.key,
                bucket: result.bucket,
              } as unknown as B,
              uploadURL: result.location,
            })
            resolve()
          },

          onError: (err) => {
            this.uppy.emit('upload-error', file, err)
            reject(err)
          },

          onAbort: () => {
            resolve() // Normal completion, not an error
          },
        })

        // Store uploader for external abort if needed
        this.#uploaders[file.id] = uploader

        // Start the upload
        uploader.start()
      })
    } finally {
      // Clean up uploader instance after upload completes or fails
      delete this.#uploaders[file.id]
    }
  }

  #shouldUseMultipart(file: UppyFile<M, B>): boolean {
    const { shouldUseMultipart } = this.opts
    if (typeof shouldUseMultipart === 'function') {
      return shouldUseMultipart(file)
    }
    if (typeof shouldUseMultipart === 'boolean') {
      return shouldUseMultipart
    }
    // Default: multipart for files > 100MB
    return (file.size ?? 0) > 100 * MB
  }

  #generateKey(file: UppyFile<M, B>): string {
    return (
      this.opts.generateObjectKey?.(file) ??
      `${crypto.randomUUID()}-${file.name}`
    )
  }

  // --------------------------------------------------------------------------
  // Remote File Upload
  // --------------------------------------------------------------------------

  /**
   * Builds the request body sent to Companion's provider get endpoint.
   * Tells Companion to use its server-side S3 upload path.
   */
  #getCompanionClientArgs(file: RemoteUppyFile<M, B>): Record<string, unknown> {
    const allowedMetaFields = getAllowedMetaFields(
      this.opts.allowedMetaFields,
      file.meta,
    )
    return {
      ...file.remote.body,
      protocol: 's3-multipart',
      size: file.data.size,
      metadata: Object.fromEntries(
        allowedMetaFields.map((key) => [key, file.meta[key]]),
      ),
    }
  }

  async #uploadRemoteFile(file: RemoteUppyFile<M, B>): Promise<void> {
    this.#setResumableUploadsCapability(false)

    const controller = new AbortController()

    const removedHandler = (removedFile: UppyFile<M, B>) => {
      if (removedFile.id === file.id) controller.abort()
    }
    this.uppy.on('file-removed', removedHandler)

    try {
      await this.uppy
        .getRequestClientForFile<RequestClient<M, B>>(file)
        .uploadRemoteFile(file, this.#getCompanionClientArgs(file), {
          signal: controller.signal,
          getQueue: () => this.#queue,
        })
    } finally {
      this.uppy.off('file-removed', removedHandler)
    }
  }
}

export type { AwsS3Options as AwsS3MultipartOptions }

/** Body type for AWS S3 upload responses */
export interface AwsBody extends Body {
  location: string
  key: string
  bucket?: string
}
