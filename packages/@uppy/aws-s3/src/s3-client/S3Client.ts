import { fetcher } from '@uppy/core/utils'
import type * as IT from './types.js'

class S3Client {
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
  }: {
    url: string
    method: IT.HttpMethod
    data?: XMLHttpRequestBodyInit
    onProgress?: IT.OnProgressFn
    signal?: AbortSignal
    contentType?: string
  }) {
    // Check if aborted while waiting for online
    if (signal?.aborted) {
      throw new DOMException('Request aborted', 'AbortError')
    }

    return fetcher(url, {
      method,
      // XHR natively supports ArrayBuffer, Uint8Array, Blob, and string
      body: ['GET', 'HEAD'].includes(method) ? undefined : data,
      headers: contentType ? { 'Content-Type': contentType } : {},
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

  public async putObject(params: IT.PutObjectParams): Promise<{
    location: string
    key: string
    etag: string | undefined
  }> {
    throw new Error('Not implemented')
  }

  public async createMultipartUpload(
    params: IT.CreateMultipartUploadParams,
  ): Promise<{
    uploadId: string
    key: string
  }> {
    throw new Error('Not implemented')
  }

  public async uploadPart(params: IT.UploadPartParams): Promise<{
    etag: string
  }> {
    throw new Error('Not implemented')
  }

  public async listParts(params: IT.ListPartsParams): Promise<IT.UploadPart[]> {
    throw new Error('Not implemented')
  }

  public async completeMultipartUpload(
    params: IT.CompleteMultipartUploadParams,
  ): Promise<{
    location: string
    bucket: string | undefined
    key: string
    etag?: string | undefined
  }> {
    throw new Error('Not implemented')
  }

  public async abortMultipartUpload(
    params: IT.AbortMultipartUploadParams,
  ): Promise<void> {
    throw new Error('Not implemented')
  }

  public async deleteObject(params: IT.DeleteObjectParams): Promise<void> {
    throw new Error('Not implemented')
  }
}

export default S3Client
