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
  /**
   * S3 bucket name (required).
   */
  bucket: string

  /**
   * AWS region. Defaults to 'us-east-1'.
   */
  region?: string

  /**
   * Companion URL for signing requests.
   * If provided, requests will be signed via Companion's /s3/sign endpoint.
   */
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

  /**
   * Custom function to determine chunk size for multipart uploads.
   * Default: 5MB minimum, scaled up for very large files.
   */
  getChunkSize?: (file: { size: number }) => number

  /**
   * Metadata fields to include in upload.
   * - `true`: Include all metadata
   * - `false` or `[]`: Include no metadata
   * - `string[]`: Include only specified fields
   */
  allowedMetaFields?: string[] | boolean

  /**
   * Custom function to generate the S3 object key.
   * Default: `{randomId}-{filename}`
   */
  getKey?: (file: UppyFile<M, B>) => string
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
  region: 'us-east-1',
  shouldUseMultipart: (file: UppyFile<any, any>) => (file.size || 0) > 100 * MB,
  allowedMetaFields: true,
} satisfies Partial<AwsS3Options<any, any>>

// ============================================================================
// MultipartUploader Types
// ============================================================================

interface MultipartUploaderOptions<M extends Meta, B extends Body> {
  s3Client: S3mini
  file: UppyFile<M, B>
  key: string
  shouldUseMultipart?: boolean
  getChunkSize?: (file: { size: number }) => number
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void
  onPartComplete?: (part: { PartNumber: number; ETag: string }) => void
  onSuccess?: (result: UploadResult) => void
  onError?: (err: Error) => void
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
// MultipartUploader Class
// ============================================================================

class MultipartUploader<M extends Meta, B extends Body> {
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

  #initChunks(): void {
    const fileSize = this.#data.size

    if (typeof this.#options.shouldUseMultipart === 'boolean') {
      this.#shouldUseMultipart = this.#options.shouldUseMultipart
    } else {
      const chunkSize = this.#getChunkSize(fileSize)
      this.#shouldUseMultipart = fileSize > chunkSize
    }

    if (this.#shouldUseMultipart && fileSize > MIN_CHUNK_SIZE) {
      let chunkSize = this.#getChunkSize(fileSize)
      chunkSize = Math.max(chunkSize, MIN_CHUNK_SIZE)
      if (Math.ceil(fileSize / chunkSize) > MAX_PARTS) {
        chunkSize = Math.ceil(fileSize / MAX_PARTS)
      }

      let offset = 0
      let index = 0
      while (offset < fileSize) {
        const end = Math.min(offset + chunkSize, fileSize)
        this.#chunks.push({ index, start: offset, end, size: end - offset })
        offset = end
        index++
      }
    } else {
      this.#chunks = [{ index: 0, start: 0, end: fileSize, size: fileSize }]
      this.#shouldUseMultipart = false
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
      // Only abort if not already aborted (pause may have already done it)
      if (!this.#abortController.signal.aborted) {
        this.#abortController.abort(pausingUploadReason)
        this.#abortController = new AbortController()
      }
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

    await this.#s3Client.putObject(
      this.#key,
      this.#data,
      this.#file.type || 'application/octet-stream',
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
    const parts: Array<{ partNumber: number; etag: string }> = []

    for (let i = 0; i < this.#chunkState.length; i++) {
      if (this.#chunkState[i].etag) {
        parts.push({ partNumber: i + 1, etag: this.#chunkState[i].etag! })
      }
    }

    for (let i = 0; i < this.#chunks.length; i++) {
      if (signal.aborted) {
        throw new Error('Upload aborted', { cause: signal.reason })
      }
      if (this.#chunkState[i].etag) continue

      const chunk = this.#chunks[i]
      const partNumber = i + 1
      const chunkData = this.#data.slice(chunk.start, chunk.end)

      const part = await this.#s3Client.uploadPart(
        this.#key,
        this.#uploadId!,
        chunkData,
        partNumber,
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
  #uploaderEvents: Record<string, EventManager<M, B> | null> = {}
  #uploaders: Record<string, MultipartUploader<M, B> | null> = {}

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
    // Clean up any pending uploads
    for (const fileId of Object.keys(this.#uploaders)) {
      this.#cleanup(fileId)
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

    if (!bucket || typeof bucket !== 'string') {
      throw new Error(
        'AwsS3: `bucket` option is required and must be a non-empty string',
      )
    }

    if (!signRequest && !getCredentials && !endpoint) {
      throw new Error(
        'AwsS3: One of `endpoint`, `signRequest`, or `getCredentials` is required',
      )
    }

    const s3Endpoint = `https://${bucket}.s3.${region || 'us-east-1'}.amazonaws.com`

    if (getCredentials) {
      // Mode: Temporary credentials (client-side signing)
      this.#s3Client = new S3mini({
        endpoint: s3Endpoint,
        getCredentials,
        region: region || 'us-east-1',
      })
    } else if (signRequest) {
      // Mode: Custom signing function
      this.#s3Client = new S3mini({
        endpoint: s3Endpoint,
        signRequest,
        region: region || 'us-east-1',
      })
    } else {
      // Mode: Companion signing (endpoint is guaranteed to be set here)
      this.#s3Client = new S3mini({
        endpoint: s3Endpoint,
        signRequest: this.#createCompanionSigner(endpoint!),
        region: region || 'us-east-1',
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

      let uploader: MultipartUploader<M, B> | null = null
      let eventManager: EventManager<M, B> | null = null

      try {
        // Create uploader
        uploader = new MultipartUploader<M, B>(data, {
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
            // Don't report pausing as an error
            if ((err as any).cause === pausingUploadReason) {
              return
            }
            this.uppy.emit('upload-error', file, err)
            this.#cleanup(file.id)
            reject(err)
          },
        })

        // Store uploader for pause/resume/cancel
        this.#uploaders[file.id] = uploader

        // Wire up pause/cancel events
        eventManager = new EventManager(this.uppy)
        this.#uploaderEvents[file.id] = eventManager

        eventManager.onFileRemove(file.id, () => {
          uploader!.abort()
          this.#cleanup(file.id)
          reject(new Error('File removed'))
        })

        eventManager.onCancelAll(file.id, () => {
          uploader!.abort()
          this.#cleanup(file.id)
          reject(new Error('Upload cancelled'))
        })

        eventManager.onFilePause(file.id, (isPaused) => {
          if (isPaused) {
            uploader!.pause()
          } else {
            uploader!.start()
          }
        })

        eventManager.onPauseAll(file.id, () => {
          uploader!.pause()
        })

        eventManager.onResumeAll(file.id, () => {
          uploader!.start()
        })

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
    if (this.opts.getKey) {
      return this.opts.getKey(file)
    }
    // Default: {randomId}-{filename}
    const randomId = crypto.randomUUID()
    return `${randomId}-${file.name}`
  }

  #cleanup(fileId: string): void {
    const uploader = this.#uploaders[fileId]
    if (uploader) {
      delete this.#uploaders[fileId]
    }

    const eventManager = this.#uploaderEvents[fileId]
    if (eventManager) {
      eventManager.remove()
      delete this.#uploaderEvents[fileId]
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
