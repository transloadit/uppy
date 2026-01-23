import {
  BasePlugin,
  type DefinePluginOpts,
  EventManager,
  type PluginOpts,
  type Uppy,
} from '@uppy/core'
import type { Body, Meta, UppyFile } from '@uppy/utils'
import {
  AbortController,
  filterFilesToEmitUploadStarted,
  filterFilesToUpload,
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
} satisfies Partial<AwsS3Options<any, any>>

// ============================================================================
// S3Uploader Types
// ============================================================================

interface S3UploaderOptions<M extends Meta, B extends Body> {
  uppy: Uppy<M, B>
  s3Client: S3mini
  file: UppyFile<M, B>
  key: string
  shouldUseMultipart?: boolean
  getChunkSize?: (file: { size: number }) => number
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void
  onPartComplete?: (part: { PartNumber: number; ETag: string }) => void
  onSuccess?: (result: UploadResult) => void
  onError?: (err: Error) => void
  onAbort?: () => void
  log?: (message: string | Error, type?: 'error' | 'warning') => void
}

interface UploadResult {
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

/** Reason for pausing (not a real error) */
const pausingUploadReason = Symbol('pausing upload, not an actual error')

// ============================================================================
// S3Uploader Class
// ============================================================================

class S3Uploader<M extends Meta, B extends Body> {
  readonly #s3Client: S3mini
  readonly #file: UppyFile<M, B>
  readonly #data: Blob
  readonly #key: string
  readonly #options: S3UploaderOptions<M, B>
  readonly #eventManager: EventManager<M, B>

  #chunks: Chunk[] = []
  #chunkState: ChunkState[] = []
  #shouldUseMultipart: boolean = false
  #uploadId?: string
  #uploadHasStarted: boolean = false
  #abortController: AbortController = new AbortController()

  constructor(data: Blob, options: S3UploaderOptions<M, B>) {
    this.#s3Client = options.s3Client
    this.#file = options.file
    this.#data = data
    this.#key = options.key
    this.#options = options
    this.#eventManager = new EventManager(options.uppy)
    this.#initChunks()
    this.#setupEvents()
  }

  #setupEvents(): void {
    const fileId = this.#file.id

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

  #initChunks(): void {
    const fileSize = this.#data.size

    // Step 1: Determine if we should use multipart
    // - If explicitly set to boolean, use that
    // - Otherwise, use multipart for files larger than MIN_CHUNK_SIZE (5MB)
    if (typeof this.#options.shouldUseMultipart === 'boolean') {
      this.#shouldUseMultipart = this.#options.shouldUseMultipart
    } else {
      this.#shouldUseMultipart = fileSize > MIN_CHUNK_SIZE
    }

    // Step 2: Force simple upload if file is too small for multipart
    // (S3 requires minimum 5MB parts, except for the last part)
    if (fileSize <= MIN_CHUNK_SIZE) {
      this.#shouldUseMultipart = false
    }

    // Step 3: Create chunks based on upload strategy
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
  }

  #getChunkSize(fileSize: number): number {
    if (this.#options.getChunkSize) {
      return this.#options.getChunkSize({ size: fileSize })
    }
    return Math.max(MIN_CHUNK_SIZE, Math.ceil(fileSize / MAX_PARTS))
  }

  start(): void {
    if (this.#uploadHasStarted) {
      // Abort any pending operations (if not already aborted)
      if (!this.#abortController.signal.aborted) {
        this.#abortController.abort(pausingUploadReason)
      }
      // Always create a fresh AbortController for resume
      this.#abortController = new AbortController()
      this.#resumeUpload()
    } else {
      this.#createUpload()
    }
  }

  pause(): void {
    this.#abortController.abort(pausingUploadReason)
    this.#abortController = new AbortController()
  }

  abort(opts?: { abortOnS3?: boolean }): void {
    this.#abortController.abort()
    // Clean up event listeners
    this.#eventManager.remove()
    if (opts?.abortOnS3 !== false && this.#uploadId) {
      this.#s3Client
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
      await this.#createUpload()
      return
    }
    try {
      const existingParts = await this.#s3Client.listParts(
        this.#uploadId,
        this.#key,
      )
      for (const part of existingParts) {
        const chunkIndex = part.partNumber - 1
        if (chunkIndex >= 0 && chunkIndex < this.#chunkState.length) {
          this.#chunkState[chunkIndex].uploaded = this.#chunks[chunkIndex].size
          this.#chunkState[chunkIndex].etag = part.etag
        }
      }
      await this.#uploadRemainingParts()
    } catch (err) {
      this.#onError(err as Error)
    }
  }

  async #simpleUpload(): Promise<void> {
    const signal = this.#abortController.signal
    if (signal.aborted) {
      throw new Error('Upload aborted', { cause: signal.reason })
    }

    await this.#s3Client.putObjectWithProgress(
      this.#key,
      this.#data,
      this.#file.type || 'application/octet-stream',
      (bytesUploaded, bytesTotal) => {
        this.#chunkState[0].uploaded = bytesUploaded
        this.#onProgress()
      },
      signal,
    )

    this.#chunkState[0].uploaded = this.#data.size
    this.#onProgress()
    this.#onSuccess({
      location: `${this.#s3Client.endpoint}/${this.#key}`,
      key: this.#key,
    })
  }

  async #multipartUpload(): Promise<void> {
    const signal = this.#abortController.signal
    if (signal.aborted) {
      throw new Error('Upload aborted', { cause: signal.reason })
    }

    this.#uploadId = await this.#s3Client.getMultipartUploadId(
      this.#key,
      this.#file.type || 'application/octet-stream',
    )
    await this.#uploadRemainingParts()
  }

  async #uploadRemainingParts(): Promise<void> {
    const signal = this.#abortController.signal
    // Collect already-uploaded parts (from resume)
    const parts = this.#chunkState
      .map((state, i) =>
        state.etag ? { partNumber: i + 1, etag: state.etag } : null,
      )
      .filter((p): p is NonNullable<typeof p> => p !== null)

    for (let i = 0; i < this.#chunks.length; i++) {
      if (signal.aborted) {
        throw new Error('Upload aborted', { cause: signal.reason })
      }
      if (this.#chunkState[i].etag) continue

      const chunk = this.#chunks[i]
      const partNumber = i + 1
      const chunkData = this.#data.slice(chunk.start, chunk.end)
      const chunkIndex = i  // Capture for closure

      const part = await this.#s3Client.uploadPartWithProgress(
        this.#key,
        this.#uploadId!,
        chunkData,
        partNumber,
        (bytesUploaded) => {
          this.#chunkState[chunkIndex].uploaded = bytesUploaded
          this.#onProgress()
        },
        signal,
      )

      this.#chunkState[i].uploaded = chunk.size
      this.#chunkState[i].etag = part.etag
      parts.push({ partNumber: part.partNumber, etag: part.etag })
      this.#onProgress()

      if (this.#options.onPartComplete) {
        this.#options.onPartComplete({
          PartNumber: part.partNumber,
          ETag: part.etag,
        })
      }
    }

    if (signal.aborted) {
      throw new Error('Upload aborted', { cause: signal.reason })
    }

    const result = await this.#s3Client.completeMultipartUpload(
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
    this.#options.onSuccess?.(result)
  }

  #onError(err: Error): void {
    if ((err as any).cause === pausingUploadReason) return
    // Also ignore abort signals from intentional cancellation
    if (err.name === 'AbortError') return
    // If we intentionally aborted, don't report any subsequent errors
    // (e.g., S3 returning 404 NoSuchUpload after we aborted the upload)
    if (this.#abortController.signal.aborted) return
    if (this.#uploadId) {
      this.#s3Client
        .abortMultipartUpload(this.#key, this.#uploadId)
        .catch((abortErr) => {
          this.#options.log?.(abortErr, 'warning')
        })
    }
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
  #uploaders: Record<string, S3Uploader<M, B> | null> = {}

  constructor(uppy: Uppy<M, B>, opts: AwsS3Options<M, B>) {
    super(uppy, { ...defaultOptions, ...opts })
    this.type = 'uploader'
    this.id = this.opts.id || 'AwsS3'
  }

  install(): void {
    this.#setResumableUploadsCapability(true)
    this.#initS3Client()
    this.uppy.addUploader(this.#upload)
    this.uppy.on('cancel-all', this.#resetResumableCapability)
  }

  uninstall(): void {
    this.#setResumableUploadsCapability(false)
    this.uppy.removeUploader(this.#upload)
    this.uppy.off('cancel-all', this.#resetResumableCapability)
    // Abort and clean up any in-flight uploads
    for (const fileId of Object.keys(this.#uploaders)) {
      const uploader = this.#uploaders[fileId]
      if (uploader) {
        uploader.abort()
      }
    }
  }

  // --------------------------------------------------------------------------
  // Resumable Uploads Capability
  // --------------------------------------------------------------------------

  #setResumableUploadsCapability = (value: boolean): void => {
    const { capabilities } = this.uppy.getState()
    this.uppy.setState({
      capabilities: {
        ...capabilities,
        resumableUploads: value,
      },
    })
  }

  #resetResumableCapability = (): void => {
    this.#setResumableUploadsCapability(true)
  }

  // --------------------------------------------------------------------------
  // S3 Client Initialization
  // --------------------------------------------------------------------------

  #initS3Client(): void {
    const { endpoint, signRequest, getCredentials, bucket, region } = this.opts

    if (typeof bucket !== 'string' || bucket.trim() === '') {
      throw new Error(
        'AwsS3: `bucket` option is required and must be a non-empty string',
      )
    }

    if (typeof region !== 'string' || region.trim() === '') {
      throw new Error(
        'AwsS3: `region` option is required and must be a non-empty string',
      )
    }

    const bucketName = bucket.trim()

    if (!signRequest && !getCredentials && !endpoint) {
      throw new Error(
        'AwsS3: `endpoint`, `signRequest`, or `getCredentials` is required',
      )
    }

    const s3Endpoint = `https://${bucketName}.s3.${region}.amazonaws.com`

    if (getCredentials) {
      // Mode: Temporary credentials (client-side signing)
      this.#s3Client = new S3mini({
        endpoint: s3Endpoint,
        getCredentials,
        region,
      })
    } else if (signRequest) {
      // Mode: Custom signing function
      this.#s3Client = new S3mini({
        endpoint: s3Endpoint,
        signRequest,
        region,
      })
    } else {
      // Mode: Companion signing (endpoint is guaranteed to be set here)
      this.#s3Client = new S3mini({
        endpoint: s3Endpoint,
        signRequest: this.#createCompanionSigner(endpoint!),
        region,
      })
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
        // Remote files not yet supported in this minimal implementation
        return Promise.reject(
          new Error('Remote file uploads not yet supported'),
        )
      }
      return this.#uploadLocalFile(file)
    })

    await Promise.allSettled(promises)
  }

  // --------------------------------------------------------------------------
  // Local File Upload
  // --------------------------------------------------------------------------

  async #uploadLocalFile(file: UppyFile<M, B>): Promise<void> {
    return new Promise((resolve, reject) => {
      const data = file.data as Blob
      const key = this.#generateKey(file)
      const shouldMultipart = this.#shouldUseMultipart(file)

      try {
        // Create uploader (events are wired internally)
        const uploader = new S3Uploader<M, B>(data, {
          uppy: this.uppy,
          s3Client: this.#s3Client,
          file,
          key,
          shouldUseMultipart: shouldMultipart,
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
            this.#cleanup(file.id)
            resolve()
          },

          onError: (err) => {
            this.uppy.emit('upload-error', file, err)
            this.#cleanup(file.id)
            reject(err)
          },

          onAbort: () => {
            this.#cleanup(file.id)
            resolve() // Normal completion, not an error
          },
        })

        // Store uploader for external abort if needed
        this.#uploaders[file.id] = uploader

        // Start the upload
        uploader.start()
      } catch (err) {
        // Cleanup on synchronous failure during setup
        this.#cleanup(file.id)
        reject(err)
      }
    })
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
    return (file.size || 0) > 100 * MB
  }

  #generateKey(file: UppyFile<M, B>): string {
    if (this.opts.generateObjectKey) {
      return this.opts.generateObjectKey(file)
    }
    // Default: {randomId}-{filename}
    const randomId = crypto.randomUUID()
    return `${randomId}-${file.name}`
  }

  #cleanup(fileId: string): void {
    if (this.#uploaders[fileId]) {
      delete this.#uploaders[fileId]
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
