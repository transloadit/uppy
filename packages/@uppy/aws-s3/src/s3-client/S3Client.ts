import { fetcher } from '@uppy/utils'
import * as C from './consts.js'
import type * as IT from './types.js'

class S3Client {
  readonly requestAbortTimeout?: number

  constructor({
    requestAbortTimeout,
    ...rest
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
      onTimeout: (timeout) => {
        // Log stall detection - upload will continue but may be slow
        console.warn(
          `[S3mini] Upload stalled - no progress for ${Math.ceil(timeout / 1000)}s`,
        )
      },
    })
  }

  public async putObject(
    key: string,
    data: XMLHttpRequestBodyInit,
    fileType: string = C.DEFAULT_STREAM_CONTENT_TYPE,
    metadata: Record<string, unknown>,
    onProgress?: IT.OnProgressFn,
    signal?: AbortSignal,
  ): Promise<{
    location: string
    key: string
    etag: string | undefined
  }> {
    throw new Error('Not implemented')
  }

  public async createMultipartUpload(
    key: string,
    fileType?: string,
    // @ts-expect-error unused
    metadata: Record<string, unknown>,
  ): Promise<{
    uploadId: string
    key: string
  }> {
    throw new Error('Not implemented')
  }

  public async uploadPart(
    key: string,
    uploadId: string,
    data: XMLHttpRequestBodyInit,
    partNumber: number,
    onProgress?: IT.OnProgressFn,
    signal?: AbortSignal,
  ): Promise<{
    etag: string
  }> {
    throw new Error('Not implemented')
  }

  public async listParts(
    uploadId: string,
    key: string,
  ): Promise<IT.UploadPart[]> {
    throw new Error('Not implemented')
  }

  public async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: IT.UploadPart[],
  ): Promise<{
    location: string
    bucket: string | undefined
    key: string
    etag?: string | undefined
  }> {
    throw new Error('Not implemented')
  }

  public async abortMultipartUpload(
    key: string,
    uploadId: string,
  ): Promise<void> {
    throw new Error('Not implemented')
  }

  public async deleteObject(key: string): Promise<void> {
    throw new Error('Not implemented')
  }
}

export default S3Client
