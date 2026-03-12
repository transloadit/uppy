import type { RequestClient } from '@uppy/companion-client'
import {
  BasePlugin,
  type DefinePluginOpts,
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
import S3Uploader, { type UploadResult } from './S3Uploader.js'
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
  /** AWS region, required for signing */
  region: string

  /** Companion URL if you want to use Companion for signing */
  companionEndpoint?: string

  /** S3 upload endpoint */
  s3Endpoint: string

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

const defaultOptions = {
  shouldUseMultipart: (file: UppyFile<any, any>) => (file.size || 0) > 100 * MB,
  allowedMetaFields: true,
  // 6 matches browser HTTP/1.1 per-origin connection limit
  limit: 6,
} satisfies Partial<AwsS3Options<any, any>>

// ============================================================================
// S3Uploader Types
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
    const {
      companionEndpoint,
      signRequest,
      getCredentials,
      s3Endpoint,
      region,
    } = this.opts

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
    } else if (companionEndpoint != null) {
      // Mode: Companion signing
      this.#s3Client = new S3mini({
        endpoint: s3Endpoint,
        signRequest: this.#createCompanionSigner(companionEndpoint),
        region,
      })
    } else {
      throw new TypeError(
        'One of options `companionEndpoint`, `signRequest`, or `getCredentials` is required',
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
              } satisfies AwsBody as unknown as B,
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
}
