/**
 * @uppy/aws-s3 - S3 upload plugin using S3mini client
 *
 * Supports both simple (putObject) and multipart uploads.
 * Uses S3mini for direct S3 operations, with signing via callback.
 */

import {
  BasePlugin,
  type DefinePluginOpts,
  EventManager,
  type PluginOpts,
  type Uppy,
} from '@uppy/core'
import type { Body, Meta, UppyFile } from '@uppy/utils'
import {
  filterFilesToEmitUploadStarted,
  filterFilesToUpload,
} from '@uppy/utils'
import packageJson from '../package.json' with { type: 'json' }
import {
  MultipartUploader,
  pausingUploadReason,
  type UploadResult,
} from './MultipartUploader.js'
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
   * Default: `uploads/{timestamp}-{randomId}/{filename}`
   */
  getKey?: (file: UppyFile<M, B>) => string
}

// ============================================================================
// Constants
// ============================================================================

const MB = 1024 * 1024

const defaultOptions = {
  region: 'us-east-1',
  shouldUseMultipart: ((file: UppyFile<any, any>) =>
    (file.size || 0) > 100 * MB) as any as true,
  allowedMetaFields: true,
} satisfies Partial<AwsS3Options<any, any>>

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
    this.#initS3Client()
    this.uppy.addUploader(this.#upload)
  }

  uninstall(): void {
    this.uppy.removeUploader(this.#upload)
    // Clean up any pending uploads
    for (const fileId of Object.keys(this.#uploaders)) {
      this.#cleanup(fileId)
    }
  }

  // --------------------------------------------------------------------------
  // S3 Client Initialization
  // --------------------------------------------------------------------------

  #initS3Client(): void {
    const { endpoint, signRequest, getCredentials, bucket, region } = this.opts

    if (!bucket) {
      throw new Error('AwsS3: `bucket` option is required')
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
    } else if (endpoint) {
      // Mode: Companion signing
      this.#s3Client = new S3mini({
        endpoint: s3Endpoint,
        signRequest: this.#createCompanionSigner(endpoint),
        region: region || 'us-east-1',
      })
    } else {
      throw new Error(
        'AwsS3: One of `endpoint`, `signRequest`, or `getCredentials` is required',
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

      // Create uploader
      const uploader = new MultipartUploader<M, B>(data, {
        s3Client: this.#s3Client,
        file,
        key,
        shouldUseMultipart: shouldMultipart,
        getChunkSize: this.opts.getChunkSize,

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

      this.#uploaders[file.id] = uploader

      // Wire up pause/cancel events
      const eventManager = new EventManager(this.uppy)
      this.#uploaderEvents[file.id] = eventManager

      eventManager.onFileRemove(file.id, () => {
        uploader.abort()
        this.#cleanup(file.id)
        reject(new Error('File removed'))
      })

      eventManager.onCancelAll(file.id, () => {
        uploader.abort()
        this.#cleanup(file.id)
        reject(new Error('Upload cancelled'))
      })

      eventManager.onFilePause(file.id, (isPaused) => {
        if (isPaused) {
          uploader.pause()
        } else {
          uploader.start()
        }
      })

      eventManager.onPauseAll(file.id, () => {
        uploader.pause()
      })

      eventManager.onResumeAll(file.id, () => {
        uploader.start()
      })

      // Start the upload
      uploader.start()
    })
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

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
    // Default: uploads/{timestamp}-{randomId}/{filename}
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    return `uploads/${timestamp}-${randomId}/${file.name}`
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

// Re-export types
export type { AwsS3Options as AwsS3MultipartOptions }

/** Body type for AWS S3 upload responses */
export interface AwsBody extends Body {
  location: string
  key: string
  bucket?: string
}
