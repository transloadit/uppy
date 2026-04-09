/**
 * Taken from https://github.com/good-lly/s3mini.git, by Jølly Good, under MIT license.
 * Modified to make it work with Uppy.
 */

import * as C from './consts.js'
import S3Client from './S3Client.js'
import { createSigV4Signer } from './signer.js'
import type * as IT from './types.js'
import * as U from './utils.js'

/**
 * S3 client for browser-compatible interaction with S3-compatible storage.
 * Supports simple uploads, multipart uploads, and object deletion.
 *
 * @example
 * // Option 1: With signRequest callback (no endpoint needed)
 * const s3 = new S3mini({
 *   signRequest: async ({ method, key, uploadId, partNumber }) => {
 *     const resp = await fetch('/api/s3/sign', {
 *       method: 'POST',
 *       body: JSON.stringify({ method, key, uploadId, partNumber }),
 *     });
 *     return resp.json(); // { url }
 *   },
 * });
 *
 * // Option 2: With getCredentials callback (endpoint required for client-side signing)
 * const s3 = new S3mini({
 *   endpoint: 'https://s3.us-east-1.amazonaws.com/my-bucket',
 *   getCredentials: async () => {
 *     const resp = await fetch('/api/s3/credentials');
 *     return resp.json(); // { credentials, region }
 *   },
 * });
 *
 * await s3.putObject('file.txt', 'Hello, World!');
 */
class S3mini extends S3Client {
  readonly endpoint?: URL
  readonly region: string
  readonly requestSizeInBytes: number

  private readonly getCredentials?: IT.GetCredentialsFn
  private cachedCredentials?: IT.CredentialsResponse
  private cachedCredentialsPromise?: Promise<IT.CredentialsResponse>
  private signRequest!: IT.SignRequestFn

  constructor({
    region = 'auto',
    requestSizeInBytes = C.DEFAULT_REQUEST_SIZE_IN_BYTES,
    requestAbortTimeout,
    ...rest
  }: IT.S3Config) {
    super({ requestAbortTimeout })
    if ('signRequest' in rest) {
      const { signRequest } = rest
      if (!signRequest) {
        throw new TypeError(
          'Either signRequest or getCredentials must be provided',
        )
      }

      if (signRequest && typeof signRequest !== 'function') {
        throw new TypeError('signRequest must be a function')
      }

      this.signRequest = signRequest
    } else if ('getCredentials' in rest) {
      const { getCredentials, endpoint } = rest
      if (typeof endpoint !== 'string' || endpoint.trim().length === 0) {
        throw new TypeError(C.ERROR_ENDPOINT_REQUIRED)
      }
      if (getCredentials && typeof getCredentials !== 'function') {
        throw new TypeError('getCredentials must be a function')
      }
      this.endpoint = new URL(this._ensureValidUrl(endpoint))

      this.getCredentials = getCredentials
      this.signRequest = this._createCredentialBasedSigner()
    } else {
      throw new TypeError(
        'Either signRequest or getCredentials must be provided',
      )
    }

    this.region = region
    this.requestSizeInBytes = requestSizeInBytes
  }

  /** Creates a presigner that fetches/caches credentials and generates pre-signed URLs. */
  private _createCredentialBasedSigner(): IT.SignRequestFn {
    return async (
      request: IT.PresignableRequest,
    ): Promise<IT.presignedResponse> => {
      const creds = await this._getCachedCredentials()
      if (this.endpoint == null) {
        throw new Error('Endpoint is required for credential-based signing')
      }
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
      try {
        const creds = await this.getCredentials!({})
        this.cachedCredentials = creds
        return creds
      } finally {
        // Clear promise cache after resolution to allow future retries
        this.cachedCredentialsPromise = undefined
      }
    }

    return this.cachedCredentialsPromise
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

  /**
   * Uploads an object to S3 using XHR for progress tracking.
   * @param key - Object key
   * @param data - Data to upload (Blob, ArrayBuffer, Uint8Array, or string)
   * @param fileType - Content type
   * @param onProgress - Optional progress callback
   * @param signal - Optional abort signal
   */
  public override async putObject(
    key: string,
    data: XMLHttpRequestBodyInit,
    fileType: string = C.DEFAULT_STREAM_CONTENT_TYPE,
    metadata?: Record<string, unknown>,
    onProgress?: IT.OnProgressFn,
    signal?: AbortSignal,
  ) {
    this._checkKey(key)

    const request: IT.PresignableRequest = { method: 'PUT', key }
    const { url } = await this.signRequest(request)

    const xhr = await this.request({
      url,
      method: request.method,
      data,
      onProgress,
      signal,
      contentType: fileType,
    })

    return {
      location: U.removeQueryString(url),
      etag: U.sanitizeETag(xhr.getResponseHeader('etag')),
      key,
    }
  }

  /** Initiates a multipart upload and returns the upload ID. */
  public override async createMultipartUpload(
    key: string,
    fileType: string = C.DEFAULT_STREAM_CONTENT_TYPE,
    metadata?: Record<string, unknown>,
  ) {
    this._checkKey(key)
    if (typeof fileType !== 'string') {
      throw new TypeError(`${C.ERROR_PREFIX}fileType must be a string`)
    }

    const request: IT.PresignableRequest = { method: 'POST', key }
    const { url } = await this.signRequest(request)
    const xhr = await this.request({
      url,
      method: request.method,
      contentType: fileType,
    })

    const parsed = U.parseXml(xhr.responseText) as Record<string, unknown>

    if (parsed && typeof parsed === 'object') {
      // Check for both cases of InitiateMultipartUploadResult
      const uploadResult =
        (parsed.initiateMultipartUploadResult as Record<string, unknown>) ||
        (parsed.InitiateMultipartUploadResult as Record<string, unknown>)

      if (uploadResult && typeof uploadResult === 'object') {
        // Check for both cases of uploadId
        const uploadId = uploadResult.uploadId || uploadResult.UploadId

        if (uploadId && typeof uploadId === 'string') {
          return { uploadId, key }
        }
      }
    }

    throw new Error(
      `${C.ERROR_PREFIX}Failed to create multipart upload: ${JSON.stringify(
        parsed,
      )}`,
    )
  }

  public override async uploadPart(
    key: string,
    uploadId: string,
    data: XMLHttpRequestBodyInit,
    partNumber: number,
    onProgress?: IT.OnProgressFn,
    signal?: AbortSignal,
  ) {
    this._validateUploadPartParams(key, uploadId, partNumber)

    const request: IT.PresignableRequest = {
      method: 'PUT',
      key,
      uploadId,
      partNumber,
    }
    const { url } = await this.signRequest(request)
    const xhr = await this.request({
      url,
      method: request.method,
      data,
      onProgress,
      signal,
    })

    const etag = U.sanitizeETag(xhr.getResponseHeader('etag'))
    if (etag == null) {
      throw new Error(
        `${C.ERROR_PREFIX}Missing ETag in uploadPart response headers`,
      )
    }

    return { etag }
  }

  /**
   * Core XHR upload implementation using @uppy/utils/fetcher.
   *
   * Features:
   * - Automatic retry with exponential backoff (3 attempts)
   * - Offline detection with automatic resume on reconnect
   * - Stall detection via ProgressTimeout
   */
  private async request({
    url,
    method,
    data,
    onProgress,
    signal,
    contentType,
    shouldRetryCredentials = true,
  }: {
    url: string
    method: IT.HttpMethod
    data?: XMLHttpRequestBodyInit
    onProgress?: IT.OnProgressFn
    signal?: AbortSignal
    contentType?: string
    shouldRetryCredentials?: boolean
  }): Promise<XMLHttpRequest> {
    // Wait for online before starting
    await this.waitForOnline(signal)

    // Check if aborted while waiting for online
    if (signal?.aborted) {
      throw new DOMException('Request aborted', 'AbortError')
    }

    try {
      return await this.xhr({
        url,
        method,
        data,
        onProgress,
        signal,
        contentType,
      })
    } catch (err: unknown) {
      // NetworkError or errors with attached XHR (from onAfterResponse throws)
      if (
        err instanceof Error &&
        'request' in err &&
        err.request instanceof XMLHttpRequest
      ) {
        const xhr = err.request as XMLHttpRequest
        if (xhr.status === 0) {
          throw new U.S3NetworkError(
            'Network error during S3 request',
            'NETWORK',
            err,
          )
        }
        // HTTP errors (non-2xx responses from NetworkError)
        const parsedBody = this._parseErrorXml(
          (name: string) => xhr.getResponseHeader(name),
          xhr.responseText,
        )
        const serviceCode =
          xhr.getResponseHeader('x-amz-error-code') ?? parsedBody.svcCode

        // If expired token error and using getCredentials, clear cache and retry once
        if (
          shouldRetryCredentials &&
          this.getCredentials != null &&
          serviceCode != null &&
          ['ExpiredToken', 'InvalidAccessKeyId'].includes(serviceCode)
        ) {
          this.clearCachedCredentials()

          // Retry with fresh credentials
          return this.request({
            url,
            method,
            data,
            onProgress,
            signal,
            contentType,
            shouldRetryCredentials: false, // prevent infinite recursion
          })
        }

        throw new U.S3ServiceError(
          `S3 returned ${xhr.status}${serviceCode ? ` – ${serviceCode}` : ''}`,
          xhr.status,
          serviceCode,
          xhr.responseText,
        )
      }

      throw err
    }
  }

  /** Lists uploaded parts for a multipart upload. */
  public override async listParts(
    uploadId: string,
    key: string,
  ): Promise<IT.UploadPart[]> {
    this._checkKey(key)
    if (!uploadId) {
      throw new TypeError(C.ERROR_UPLOAD_ID_REQUIRED)
    }
    const request: IT.PresignableRequest = { method: 'GET', key, uploadId }
    const { url } = await this.signRequest(request)
    const xhr = await this.request({
      url,
      method: request.method,
    })

    const parsed = U.parseXml(xhr.responseText) as Record<string, unknown>
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
          etag: U.sanitizeXmlETag(String(p.ETag)),
        }))
    }
    return []
  }

  /** Completes a multipart upload by combining all uploaded parts. */
  public override async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<IT.UploadPart>,
  ) {
    const xmlBody = this._buildCompleteMultipartUploadXml(parts)

    const request: IT.PresignableRequest = { method: 'POST', key, uploadId }
    const { url } = await this.signRequest(request)
    const xhr = await this.request({
      url,
      method: request.method,
      contentType: C.XML_CONTENT_TYPE,
      data: xmlBody,
    })

    const parsed = U.parseXml(xhr.responseText)
    if (parsed && typeof parsed === 'object') {
      // Check for both cases (camelCase from our parser, PascalCase from S3)
      const result =
        parsed.completeMultipartUploadResult ||
        parsed.CompleteMultipartUploadResult ||
        parsed

      if (result && typeof result === 'object') {
        const r = result as Record<string, unknown>

        // S3 returns PascalCase (Location, Bucket, Key, ETag).
        // Normalize to lowercase for our type interface.
        const resultLocation = (r.Location || r.location) as string | undefined
        const resultBucket = (r.Bucket || r.bucket) as string | undefined
        const resultKey = (r.Key || r.key) as string | undefined
        const rawEtag = (r.ETag || r.eTag || r.etag) as string | undefined

        if (!resultLocation || !resultKey) {
          throw new Error(
            `${C.ERROR_PREFIX}CompleteMultipartUpload response missing Location or Key: ${JSON.stringify(r)}`,
          )
        }

        const etag = rawEtag ? U.sanitizeXmlETag(rawEtag) : undefined

        return {
          location: resultLocation,
          bucket: resultBucket,
          key: resultKey,
          etag,
        }
      }
    }

    throw new Error(
      `${C.ERROR_PREFIX}Failed to complete multipart upload: ${JSON.stringify(
        parsed,
      )}`,
    )
  }

  /** Aborts a multipart upload and removes all uploaded parts. */
  public override async abortMultipartUpload(key: string, uploadId: string) {
    this._checkKey(key)
    if (!uploadId) {
      throw new TypeError(C.ERROR_UPLOAD_ID_REQUIRED)
    }

    const request: IT.PresignableRequest = { method: 'DELETE', key, uploadId }
    const { url } = await this.signRequest(request)
    const xhr = await this.request({
      url,
      method: request.method,
    })

    const parsed = U.parseXml(xhr.responseText) as Record<string, unknown>
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
  public override async deleteObject(key: string) {
    const request: IT.PresignableRequest = { method: 'DELETE', key }
    const { url } = await this.signRequest(request)

    const xhr = await this.request({
      url,
      method: request.method,
    })

    if (xhr.status !== 200 && xhr.status !== 204) {
      throw new Error(
        `${C.ERROR_PREFIX}Failed to delete object. HTTP status: ${status}`,
      )
    }
  }

  /**
   * Clears cached credentials.
   * Call this method when you need to force a credential refresh on the next request.
   */
  public clearCachedCredentials(): void {
    this.cachedCredentials = undefined
    this.cachedCredentialsPromise = undefined
  }

  private _parseErrorXml(
    getHeader: (name: string) => string | null,
    body: string,
  ): { svcCode?: string; errorMessage?: string } {
    if (getHeader('content-type') !== 'application/xml') {
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
}

export { S3mini }
export default S3mini
