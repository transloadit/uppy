/**
 * Taken from https://github.com/good-lly/s3mini.git, by Jølly Good, under MIT license.
 * Modified to make it work with Uppy.
 */

import { fetcher } from '@uppy/utils'
import * as C from './consts.js'
import { createSigV4Signer } from './signer.js'
import type * as IT from './types.js'
import * as U from './utils.js'

/**
 * S3 client for browser-compatible interaction with S3-compatible storage.
 * Supports simple uploads, multipart uploads, and object deletion.
 *
 * @example
 * // Option 1: With signRequest callback
 * const s3 = new S3mini({
 *   endpoint: 'https://s3.amazonaws.com/my-bucket',
 *   signRequest: async ({ method, url, headers }) => {
 *     return await fetchSignedHeaders(method, url, headers);
 *   },
 * });
 *
 * // Option 2: With getCredentials callback (client-side signing)
 * const s3 = new S3mini({
 *   endpoint: 'https://s3.amazonaws.com/my-bucket',
 *   getCredentials: async () => {
 *     const resp = await fetch('/api/s3/credentials');
 *     return resp.json(); // { credentials, bucket, region }
 *   },
 * });
 *
 * await s3.putObject('file.txt', 'Hello, World!');
 */
class S3mini {
  readonly endpoint: URL
  readonly region: string
  readonly requestSizeInBytes: number
  readonly requestAbortTimeout?: number

  private readonly getCredentials?: IT.getCredentialsFn
  private cachedCredentials?: IT.CredentialsResponse
  private cachedCredentialsPromise?: Promise<IT.CredentialsResponse>
  private signRequest!: IT.signRequestFn

  constructor({
    endpoint,
    signRequest,
    getCredentials,
    region = 'auto',
    requestSizeInBytes = C.DEFAULT_REQUEST_SIZE_IN_BYTES,
    requestAbortTimeout = undefined,
  }: IT.S3Config) {
    this._validateConstructorParams(endpoint, signRequest, getCredentials)
    this.endpoint = new URL(this._ensureValidUrl(endpoint))
    this.region = region
    this.requestSizeInBytes = requestSizeInBytes
    this.requestAbortTimeout = requestAbortTimeout

    if (signRequest) {
      this.signRequest = signRequest
    } else if (getCredentials) {
      this.getCredentials = getCredentials
      this.signRequest = this._createCredentialBasedSigner()
    }
  }

  /** Creates a presigner that fetches/caches credentials and generates pre-signed URLs. */
  private _createCredentialBasedSigner(): IT.signRequestFn {
    return async (
      request: IT.presignableRequest,
    ): Promise<IT.presignedResponse> => {
      const creds = await this._getCachedCredentials()
      const presigner = createSigV4Signer({
        accessKeyId: creds.credentials.accessKeyId,
        secretAccessKey: creds.credentials.secretAccessKey,
        sessionToken: creds.credentials.sessionToken,
        region: creds.region || this.region,
        endpoint: this.endpoint.toString(),
      })
      return presigner(request)
    }
  }

  /** Gets cached credentials or fetches new ones. */
  private async _getCachedCredentials(): Promise<IT.CredentialsResponse> {
    // Return Cached Credentials if available
    if (this.cachedCredentials != null) {
      return this.cachedCredentials
    }

    // Cache the promise so concurrent calls wait for the same fetch
    if (this.cachedCredentialsPromise == null) {
      this.cachedCredentialsPromise = this.getCredentials!({})
        .then((creds) => {
          this.cachedCredentials = creds
          return creds
        })
        .finally(() => {
          // Clear promise cache after resolution to allow future retries
          this.cachedCredentialsPromise = undefined
        })
    }

    return this.cachedCredentialsPromise
  }

  private _validateConstructorParams(
    endpoint: string,
    signRequest?: IT.signRequestFn,
    getCredentials?: IT.getCredentialsFn,
  ): void {
    if (typeof endpoint !== 'string' || endpoint.trim().length === 0) {
      throw new TypeError(C.ERROR_ENDPOINT_REQUIRED)
    }

    if (!signRequest && !getCredentials) {
      throw new TypeError(
        'Either signRequest or getCredentials must be provided',
      )
    }

    if (signRequest && typeof signRequest !== 'function') {
      throw new TypeError('signRequest must be a function')
    }

    if (getCredentials && typeof getCredentials !== 'function') {
      throw new TypeError('getCredentials must be a function')
    }
  }

  private _ensureValidUrl(raw: string): string {
    const candidate = /^(https?:)?\/\//i.test(raw) ? raw : `https://${raw}`
    try {
      new URL(candidate)

      // Find the last non-slash character
      let endIndex = candidate.length
      while (endIndex > 0 && candidate[endIndex - 1] === '/') {
        endIndex--
      }
      return endIndex === candidate.length
        ? candidate
        : candidate.substring(0, endIndex)
    } catch {
      const msg = `${C.ERROR_ENDPOINT_FORMAT} But provided: "${raw}"`
      throw new TypeError(msg)
    }
  }

  private _checkKey(key: string): void {
    if (typeof key !== 'string' || key.trim().length === 0) {
      throw new TypeError(C.ERROR_KEY_REQUIRED)
    }
  }

  private _checkOpts(opts: object): void {
    if (typeof opts !== 'object') {
      throw new TypeError(`${C.ERROR_PREFIX}opts must be an object`)
    }
  }

  private _filterIfHeaders(opts: Record<string, unknown>): {
    filteredOpts: Record<string, string>
    conditionalHeaders: Record<string, unknown>
  } {
    const filteredOpts: Record<string, string> = {}
    const conditionalHeaders: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(opts)) {
      if (
        C.IFHEADERS.has(
          key.toLowerCase() as typeof C.IFHEADERS extends Set<infer T>
            ? T
            : never,
        )
      ) {
        conditionalHeaders[key] = value
      } else {
        filteredOpts[key] = value as string
      }
    }

    return { filteredOpts, conditionalHeaders }
  }

  private _validateData(data: unknown): BodyInit {
    if (
      typeof data === 'string' ||
      data instanceof ArrayBuffer ||
      ArrayBuffer.isView(data) ||
      data instanceof Blob
    ) {
      return data as BodyInit
    }
    throw new TypeError(C.ERROR_DATA_BUFFER_REQUIRED)
  }

  private _validateUploadPartParams(
    key: string,
    uploadId: string,
    partNumber: number,
  ): void {
    this._checkKey(key)
    if (typeof uploadId !== 'string' || uploadId.trim().length === 0) {
      throw new TypeError(C.ERROR_UPLOAD_ID_REQUIRED)
    }
    if (!Number.isInteger(partNumber) || partNumber <= 0) {
      throw new TypeError(
        `${C.ERROR_PREFIX}partNumber must be a positive integer`,
      )
    }
  }

  private async _presignedRequest(
    method: IT.HttpMethod, // 'GET' | 'HEAD' | 'PUT' | 'POST' | 'DELETE'
    key: string, // '' allowed for bucket‑level ops
    {
      uploadId,
      partNumber,
      body = '',
      contentType,
      tolerated = [],
    }: {
      uploadId?: string
      partNumber?: number
      body?: BodyInit
      contentType?: string
      tolerated?: number[]
    } = {},
  ): Promise<Response> {
    // Get pre-signed URL from callback
    const { url } = await this.signRequest({
      method,
      key,
      uploadId,
      partNumber,
    })

    // Build request headers
    const requestHeaders: Record<string, string> = contentType
      ? { 'Content-Type': contentType }
      : {}

    try {
      return await this._sendRequest(
        url,
        method,
        requestHeaders,
        body,
        tolerated,
      )
    } catch (err) {
      // If expired token error and using getCredentials, clear cache and retry once
      if (
        this.getCredentials &&
        err instanceof U.S3ServiceError &&
        err.code &&
        ['ExpiredToken', 'InvalidAccessKeyId'].includes(err.code)
      ) {
        // Clear cache
        this.clearCachedCredentials()

        // Retry with fresh credentials
        const fresh = await this.signRequest({
          method,
          key,
          uploadId,
          partNumber,
        })
        return this._sendRequest(
          fresh.url,
          method,
          contentType ? { 'Content-Type': contentType } : {},
          body,
          tolerated,
        )
      }
      throw err
    }
  }

  /**
   * Uploads an object to S3 using XHR for progress tracking.
   * @param key - Object key
   * @param data - Data to upload (Blob, ArrayBuffer, Uint8Array, or string)
   * @param fileType - Content type
   * @param onProgress - Optional progress callback
   * @param signal - Optional abort signal
   */
  public async putObject(
    key: string,
    data: IT.BinaryData | string,
    fileType: string = C.DEFAULT_STREAM_CONTENT_TYPE,
    onProgress?: IT.OnProgressFn,
    signal?: AbortSignal,
  ): Promise<IT.PutObjectResult> {
    this._checkKey(key)

    const attemptUpload = async (): Promise<IT.PutObjectResult> => {
      const { url } = await this.signRequest({ method: 'PUT', key })
      return this._xhrUpload(url, data, onProgress, signal, fileType)
    }

    try {
      return await attemptUpload()
    } catch (err) {
      if (this._isExpiredTokenError(err)) {
        this.clearCachedCredentials()
        return attemptUpload()
      }
      throw err
    }
  }

  /** Initiates a multipart upload and returns the upload ID. */
  public async getMultipartUploadId(
    key: string,
    fileType: string = C.DEFAULT_STREAM_CONTENT_TYPE,
  ): Promise<string> {
    this._checkKey(key)
    if (typeof fileType !== 'string') {
      throw new TypeError(`${C.ERROR_PREFIX}fileType must be a string`)
    }
    const res = await this._presignedRequest('POST', key, {
      contentType: fileType,
    })
    const parsed = U.parseXml(await res.text()) as Record<string, unknown>

    if (parsed && typeof parsed === 'object') {
      // Check for both cases of InitiateMultipartUploadResult
      const uploadResult =
        (parsed.initiateMultipartUploadResult as Record<string, unknown>) ||
        (parsed.InitiateMultipartUploadResult as Record<string, unknown>)

      if (uploadResult && typeof uploadResult === 'object') {
        // Check for both cases of uploadId
        const uploadId = uploadResult.uploadId || uploadResult.UploadId

        if (uploadId && typeof uploadId === 'string') {
          return uploadId
        }
      }
    }

    throw new Error(
      `${C.ERROR_PREFIX}Failed to create multipart upload: ${JSON.stringify(
        parsed,
      )}`,
    )
  }

  public async uploadPart(
    key: string,
    uploadId: string,
    data: IT.BinaryData | string,
    partNumber: number,
    onProgress?: IT.OnProgressFn,
    signal?: AbortSignal,
  ): Promise<IT.UploadPart> {
    this._validateUploadPartParams(key, uploadId, partNumber)

    const attemptUpload = async (): Promise<IT.UploadPart> => {
      const { url } = await this.signRequest({
        method: 'PUT',
        key,
        uploadId,
        partNumber,
      })
      const result = await this._xhrUpload(url, data, onProgress, signal)
      return {
        partNumber,
        etag: result.headers.get('etag')
          ? U.sanitizeETag(result.headers.get('etag')!)
          : '',
      }
    }

    try {
      return await attemptUpload()
    } catch (err) {
      if (this._isExpiredTokenError(err)) {
        this.clearCachedCredentials()
        return attemptUpload()
      }
      throw err
    }
  }

  /**
   * Helper to check if we're currently offline in a browser context.
   */
  private _isOffline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine === false
  }

  /** Checks if error is an expired/invalid token that can be retried with fresh credentials */
  private _isExpiredTokenError(err: unknown): boolean {
    return (
      this.getCredentials != null &&
      err instanceof U.S3ServiceError &&
      err.code != null &&
      ['ExpiredToken', 'InvalidAccessKeyId'].includes(err.code)
    )
  }

  /**
   * Core XHR upload implementation using @uppy/utils/fetcher.
   *
   * Features:
   * - Automatic retry with exponential backoff (3 attempts)
   * - Offline detection with automatic resume on reconnect
   * - Stall detection via ProgressTimeout
   */
  private async _xhrUpload(
    url: string,
    data: IT.BinaryData | string,
    onProgress?: IT.OnProgressFn,
    signal?: AbortSignal,
    contentType?: string,
  ): Promise<IT.PutObjectResult> {
    // Wait for online before starting
    if (this._isOffline()) {
      await this._waitForOnline(signal)
    }

    try {
      const xhr = await fetcher(url, {
        method: 'PUT',
        // XHR natively supports ArrayBuffer, Uint8Array, Blob, and string
        body: data as XMLHttpRequestBodyInit,
        headers: contentType ? { 'Content-Type': contentType } : {},
        signal,
        timeout: this.requestAbortTimeout || 30_000,
        retries: 3,
        /**
         * Retry logic:
         * - Retries: 5xx server errors, 429 rate limiting
         * - Skips: 4xx client errors (except 429), offline (handled separately)
         */
        shouldRetry: (xhr) => {
          // If offline, don't retry via fetcher - our handler will resume
          if (this._isOffline()) return false
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

      // Return Response-like object for test compatibility
      return {
        status: xhr.status,
        ok: xhr.status >= 200 && xhr.status < 300,
        headers: {
          get: (name: string) => xhr.getResponseHeader(name),
        },
      }
    } catch (err: unknown) {
      return this._handleUploadError(
        err,
        url,
        data,
        onProgress,
        signal,
        contentType,
      )
    }
  }

  /**
   * Handles errors from _xhrUpload, including offline recovery and error mapping.
   */
  private async _handleUploadError(
    err: unknown,
    url: string,
    data: IT.BinaryData | string,
    onProgress?: IT.OnProgressFn,
    signal?: AbortSignal,
    contentType?: string,
  ): Promise<IT.PutObjectResult> {
    // Offline during request - wait and retry
    if (this._isOffline()) {
      await this._waitForOnline(signal)
      // Check if aborted while waiting for online
      if (signal?.aborted) {
        throw new DOMException('Upload aborted', 'AbortError')
      }
      return this._xhrUpload(url, data, onProgress, signal, contentType)
    }

    // Abort errors pass through
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err
    }

    // Extract XHR from error if present (fetcher attaches it)
    const errObj = err as { request?: XMLHttpRequest; name?: string }

    // Network errors
    if (
      errObj.name === 'NetworkError' ||
      (errObj.request && !errObj.request.status)
    ) {
      throw new U.S3NetworkError('Network error during upload', 'NETWORK', err)
    }

    // HTTP errors (non-2xx responses)
    if (errObj.request instanceof XMLHttpRequest && errObj.request.status) {
      const xhr = errObj.request
      throw new U.S3ServiceError(
        `S3 returned ${xhr.status}`,
        xhr.status,
        undefined,
        xhr.responseText,
      )
    }

    throw err
  }

  /** Lists uploaded parts for a multipart upload. */
  public async listParts(
    uploadId: string,
    key: string,
  ): Promise<IT.UploadPart[]> {
    this._checkKey(key)
    if (!uploadId) {
      throw new TypeError(C.ERROR_UPLOAD_ID_REQUIRED)
    }
    const res = await this._presignedRequest('GET', key, {
      uploadId,
    })

    const parsed = U.parseXml(await res.text()) as Record<string, unknown>
    const result = (parsed.listPartsResult ||
      parsed.ListPartsResult ||
      parsed) as Record<string, unknown>

    if (result && typeof result === 'object') {
      const parts = result.Part || result.part || []
      const partsArray = Array.isArray(parts) ? parts : [parts]

      return partsArray
        .filter(
          (p): p is Record<string, unknown> =>
            p != null &&
            typeof p === 'object' &&
            'PartNumber' in p &&
            'ETag' in p,
        )
        .map((p) => ({
          partNumber: parseInt(String(p.PartNumber), 10),
          etag: U.sanitizeETag(String(p.ETag)),
        }))
    }
    return []
  }

  /** Completes a multipart upload by combining all uploaded parts. */
  public async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<IT.UploadPart>,
  ): Promise<IT.CompleteMultipartUploadResult> {
    const xmlBody = this._buildCompleteMultipartUploadXml(parts)

    const res = await this._presignedRequest('POST', key, {
      uploadId,
      body: xmlBody,
      contentType: C.XML_CONTENT_TYPE,
    })

    const parsed = U.parseXml(await res.text()) as Record<string, unknown>
    if (parsed && typeof parsed === 'object') {
      // Check for both cases
      const result =
        parsed.completeMultipartUploadResult ||
        parsed.CompleteMultipartUploadResult ||
        parsed

      if (result && typeof result === 'object') {
        const resultObj = result as Record<string, unknown>

        // Handle ETag in all its variations
        const etag = resultObj.ETag || resultObj.eTag || resultObj.etag
        if (etag && typeof etag === 'string') {
          return {
            ...resultObj,
            etag: U.sanitizeETag(etag),
          } as IT.CompleteMultipartUploadResult
        }

        return result as IT.CompleteMultipartUploadResult
      }
    }

    throw new Error(
      `${C.ERROR_PREFIX}Failed to complete multipart upload: ${JSON.stringify(
        parsed,
      )}`,
    )
  }

  /** Aborts a multipart upload and removes all uploaded parts. */
  public async abortMultipartUpload(
    key: string,
    uploadId: string,
  ): Promise<object> {
    this._checkKey(key)
    if (!uploadId) {
      throw new TypeError(C.ERROR_UPLOAD_ID_REQUIRED)
    }

    const res = await this._presignedRequest('DELETE', key, {
      uploadId,
    })
    const parsed = U.parseXml(await res.text()) as Record<string, unknown>
    if (
      parsed &&
      'error' in parsed &&
      typeof parsed.error === 'object' &&
      parsed.error !== null &&
      'message' in parsed.error
    ) {
      throw new Error(
        `${C.ERROR_PREFIX}Failed to abort multipart upload: ${String(
          parsed.error.message,
        )}`,
      )
    }
    return { status: 'Aborted', key, uploadId, response: parsed }
  }

  private _buildCompleteMultipartUploadXml(
    parts: Array<IT.UploadPart>,
  ): string {
    let xml = '<CompleteMultipartUpload>'
    for (const part of parts) {
      xml += `<Part><PartNumber>${part.partNumber}</PartNumber><ETag>${part.etag}</ETag></Part>`
    }
    xml += '</CompleteMultipartUpload>'
    return xml
  }

  /** Deletes an object from the bucket. Returns true on success. */
  public async deleteObject(key: string): Promise<boolean> {
    const res = await this._presignedRequest('DELETE', key, {
      tolerated: [200, 204],
    })
    return res.status === 200 || res.status === 204
  }

  /**
   * Clears cached credentials.
   * Call this method when you need to force a credential refresh on the next request.
   */
  public clearCachedCredentials(): void {
    this.cachedCredentials = undefined
    this.cachedCredentialsPromise = undefined
  }

  /**
   * Waits for the browser to come back online.
   * Returns a promise that resolves when the 'online' event fires,
   * or rejects if the abort signal is triggered.
   */
  private _waitForOnline(signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
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

      const onOnline = () => {
        signal?.removeEventListener('abort', onAbort)
        resolve()
      }

      const onAbort = () => {
        window.removeEventListener('online', onOnline)
        reject(new DOMException('Upload aborted', 'AbortError'))
      }

      window.addEventListener('online', onOnline, { once: true })
      signal?.addEventListener('abort', onAbort, { once: true })
    })
  }

  private async _sendRequest(
    url: string,
    method: IT.HttpMethod,
    headers: Record<string, string>,
    body?: BodyInit,
    toleratedStatusCodes: number[] = [],
  ): Promise<Response> {
    // Wait for online if currently offline
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      await this._waitForOnline()
    }

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: ['GET', 'HEAD'].includes(method) ? undefined : body,
        signal: this.requestAbortTimeout
          ? AbortSignal.timeout(this.requestAbortTimeout)
          : undefined,
      })
      if (res.ok || toleratedStatusCodes.includes(res.status)) {
        return res
      }
      await this._handleErrorResponse(res)
      return res
    } catch (err: unknown) {
      // Check if we're offline - if so, wait and retry
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        await this._waitForOnline()
        // Retry the request
        return this._sendRequest(
          url,
          method,
          headers,
          body,
          toleratedStatusCodes,
        )
      }

      const code = U.extractErrCode(err)
      if (
        code &&
        ['ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT', 'ECONNREFUSED'].includes(code)
      ) {
        throw new U.S3NetworkError(`S3 network error: ${code}`, code, err)
      }
      throw err
    }
  }

  private _parseErrorXml(
    headers: Headers,
    body: string,
  ): { svcCode?: string; errorMessage?: string } {
    if (headers.get('content-type') !== 'application/xml') {
      return {}
    }
    const parsedBody = U.parseXml(body)
    if (
      !parsedBody ||
      typeof parsedBody !== 'object' ||
      !('Error' in parsedBody) ||
      !parsedBody.Error ||
      typeof parsedBody.Error !== 'object'
    ) {
      return {}
    }
    const error = parsedBody.Error
    return {
      svcCode:
        'Code' in error && typeof error.Code === 'string'
          ? error.Code
          : undefined,
      errorMessage:
        'Message' in error && typeof error.Message === 'string'
          ? error.Message
          : undefined,
    }
  }

  private async _handleErrorResponse(res: Response): Promise<void> {
    const errorBody = await res.text()
    const parsedErrorBody = this._parseErrorXml(res.headers, errorBody)
    const svcCode =
      res.headers.get('x-amz-error-code') ??
      parsedErrorBody.svcCode ??
      'Unknown'
    throw new U.S3ServiceError(
      `S3 returned ${res.status} – ${svcCode}`,
      res.status,
      svcCode,
      errorBody,
    )
  }
}

export { S3mini }
export default S3mini
