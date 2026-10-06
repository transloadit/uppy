import { fetcher } from '@uppy/core/utils'
import type * as IT from './types.js'
import * as U from './utils.js'

abstract class S3Client {
  readonly requestAbortTimeout?: number

  constructor({
    requestAbortTimeout,
  }: { requestAbortTimeout?: number | undefined }) {
    this.requestAbortTimeout = requestAbortTimeout
  }

  /**
   * Helper to check if we're currently offline in a browser context.
   */
  protected isOffline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine === false
  }

  /**
   * Waits for the browser to come back online.
   * Returns a promise that resolves when the 'online' event fires,
   * or rejects if the abort signal is triggered.
   */
  protected waitForOnline(signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isOffline()) {
        resolve()
        return
      }
      // Already online or not in browser
      if (
        typeof navigator === 'undefined' ||
        navigator.onLine === true ||
        navigator.onLine === undefined
      ) {
        resolve()
        return
      }

      // Already aborted
      if (signal?.aborted) {
        reject(new DOMException('Upload aborted', 'AbortError'))
        return
      }

      const cleanup = () => {
        window.removeEventListener('online', onOnline)
        signal?.removeEventListener('abort', onAbort)
      }

      const onOnline = () => {
        cleanup()
        resolve()
      }

      const onAbort = () => {
        cleanup()
        reject(new DOMException('Upload aborted', 'AbortError'))
      }

      window.addEventListener('online', onOnline)
      signal?.addEventListener('abort', onAbort)
    })
  }

  protected async xhr({
    url,
    method,
    data,
    onProgress,
    signal,
    contentType,
    headers,
  }: {
    url: string
    method: IT.HttpMethod
    data?: XMLHttpRequestBodyInit
    onProgress?: IT.OnProgressFn
    signal?: AbortSignal
    contentType?: string
    headers?: Record<string, string>
  }) {
    // Check if aborted while waiting for online
    if (signal?.aborted) {
      throw new DOMException('Request aborted', 'AbortError')
    }

    return fetcher(url, {
      method,
      // XHR natively supports ArrayBuffer, Uint8Array, Blob, and string
      body: ['GET', 'HEAD'].includes(method) ? undefined : data,
      // The signer's headers come last so a `Content-Type` it signed wins over
      // the file's own type. `fetcher` folds names that differ only in case,
      // so this holds for a lowercase `content-type` too.
      headers: {
        ...(contentType ? { 'Content-Type': contentType } : {}),
        ...headers,
      },
      signal,
      timeout: this.requestAbortTimeout,
      retries: 3,
      /**
       * Retry logic:
       * - Retries: 5xx server errors, 429 rate limiting
       * - Skips: 4xx client errors (except 429), offline (handled separately)
       */
      shouldRetry: (xhr) => {
        // If offline, don't retry via fetcher - our handler will resume
        if (this.isOffline()) return false
        // Don't retry client errors (except 429 rate limit)
        if (xhr.status >= 400 && xhr.status < 500 && xhr.status !== 429) {
          return false
        }
        return true
      },
      onUploadProgress: (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(event.loaded, event.total)
        }
      },
    })
  }

  /** Uploads `data` with an S3 POST policy: a `multipart/form-data` POST of `fields` to the bucket `url`. */
  protected async postObject({
    url,
    fields,
    headers,
    data,
    onProgress,
    signal,
  }: {
    url: string
    fields: Record<string, string>
    headers?: Record<string, string>
    data: Blob
    onProgress?: IT.OnProgressFn
    signal?: AbortSignal
  }) {
    const xhr = await this.xhr({
      url,
      method: 'POST',
      data: U.buildPostPolicyForm(fields, data),
      // a Content-Type header would replace the form boundary the browser sets
      headers: U.omitContentType(headers),
      // the form envelope adds bytes, so scale progress to the file
      onProgress:
        onProgress &&
        ((loaded, total) =>
          onProgress(
            Math.min(data.size, Math.round((loaded / total) * data.size)),
            data.size,
          )),
      signal,
    })
    return {
      location: U.postObjectLocation(url, fields.key),
      etag: U.sanitizeETag(xhr.getResponseHeader('etag')),
      key: fields.key,
    }
  }

  public abstract putObject(params: IT.PutObjectParams): Promise<{
    location: string
    key: string
    etag: string | undefined
  }>

  public abstract createMultipartUpload(
    params: IT.CreateMultipartUploadParams,
  ): Promise<{
    uploadId: string
    key: string
  }>

  public abstract uploadPart(params: IT.UploadPartParams): Promise<{
    etag: string
  }>

  public abstract listParts(
    params: IT.ListPartsParams,
  ): Promise<IT.UploadPart[]>

  public abstract completeMultipartUpload(
    params: IT.CompleteMultipartUploadParams,
  ): Promise<{
    location: string
    bucket: string | undefined
    key: string
    etag?: string | undefined
  }>

  public abstract abortMultipartUpload(
    params: IT.AbortMultipartUploadParams,
  ): Promise<void>
}

export default S3Client
