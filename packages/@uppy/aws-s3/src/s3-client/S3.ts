/**
 * Taken from https://github.com/good-lly/s3mini.git, by Jølly Good, under MIT license.
 * Modified to make it work with Uppy.
 */

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

  /** Creates a signer that fetches/caches credentials and signs requests. */
  private _createCredentialBasedSigner(): IT.signRequestFn {
    return async (request: IT.signableRequest): Promise<IT.signedHeaders> => {
      const creds = await this._getCachedCredentials()
      const signer = createSigV4Signer({
        accessKeyId: creds.credentials.accessKeyId,
        secretAccessKey: creds.credentials.secretAccessKey,
        sessionToken: creds.credentials.sessionToken,
        region: creds.region || this.region,
      })
      return signer(request)
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
      this.cachedCredentialsPromise = this.getCredentials!()
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
      ArrayBuffer.isView(data)
    ) {
      return data as BodyInit
    }
    throw new TypeError(C.ERROR_DATA_BUFFER_REQUIRED)
  }

  private _validateUploadPartParams(
    key: string,
    uploadId: string,
    data: IT.BinaryData | string,
    partNumber: number,
    opts: object,
  ): BodyInit {
    this._checkKey(key)
    if (typeof uploadId !== 'string' || uploadId.trim().length === 0) {
      throw new TypeError(C.ERROR_UPLOAD_ID_REQUIRED)
    }
    if (!Number.isInteger(partNumber) || partNumber <= 0) {
      throw new TypeError(
        `${C.ERROR_PREFIX}partNumber must be a positive integer`,
      )
    }
    this._checkOpts(opts)
    return this._validateData(data)
  }

  private async _signedRequest(
    method: IT.HttpMethod, // 'GET' | 'HEAD' | 'PUT' | 'POST' | 'DELETE'
    key: string, // ‘’ allowed for bucket‑level ops
    {
      query = {}, // ?query=string
      body = '', // BodyInit | undefined
      headers = {}, // extra/override headers
      tolerated = [], // [200, 404] etc.
      withQuery = false, // append query string to signed URL
    }: {
      query?: Record<string, unknown>
      body?: BodyInit
      headers?:
        | Record<string, string | number | undefined>
        | IT.SSECHeaders
        | IT.AWSHeaders
      tolerated?: number[]
      withQuery?: boolean
    } = {},
  ): Promise<Response> {
    const { filteredOpts, conditionalHeaders } = ['GET', 'HEAD'].includes(
      method,
    )
      ? this._filterIfHeaders(query)
      : { filteredOpts: query, conditionalHeaders: {} }

    const url = new URL(this.endpoint)

    const encodedKey = key ? U.uriResourceEscape(key) : ''

    if (encodedKey && encodedKey.length > 0) {
      url.pathname =
        url.pathname === '/'
          ? `/${encodedKey.replace(/^\/+/, '')}`
          : `${url.pathname}/${encodedKey.replace(/^\/+/, '')}`
    }

    // build query string
    if (Object.keys(query).length > 0) {
      withQuery = true
    }

    const filteredOptsStrings = Object.fromEntries(
      Object.entries(filteredOpts).map(([k, v]) => [k, String(v)]),
    ) as Record<string, string>

    const finalUrl =
      withQuery && Object.keys(filteredOpts).length
        ? `${url}?${new URLSearchParams(filteredOptsStrings)}`
        : url

    const baseHeaders: Record<string, string> = {
      [C.HEADER_AMZ_CONTENT_SHA256]: C.UNSIGNED_PAYLOAD,
    }

    // convert all header values to strings and merge
    for (const [k, v] of Object.entries({
      ...headers,
      ...conditionalHeaders,
    })) {
      if (v !== undefined) {
        baseHeaders[k] = String(v)
      }
    }

    // call the signedRequest callback
    const signedHeaders = await this.signRequest({
      method,
      url: finalUrl.toString(),
      headers: baseHeaders,
    })

    try {
      return await this._sendRequest(
        finalUrl.toString(),
        method,
        signedHeaders,
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
        // Clear timer and cache
        this.clearCachedCredentials()

        // Retry with fresh credentials
        const freshSignedHeaders = await this.signRequest({
          method,
          url: finalUrl.toString(),
          headers: baseHeaders,
        })
        return this._sendRequest(
          finalUrl.toString(),
          method,
          freshSignedHeaders,
          body,
          tolerated,
        )
      }
      throw err
    }
  }

  /** Uploads an object to the S3-compatible service. */
  public async putObject(
    key: string,
    data: string | IT.BinaryData,
    fileType: string = C.DEFAULT_STREAM_CONTENT_TYPE,
    ssecHeaders?: IT.SSECHeaders,
    additionalHeaders?: IT.AWSHeaders,
  ): Promise<Response> {
    return this._signedRequest('PUT', key, {
      body: this._validateData(data),
      headers: {
        [C.HEADER_CONTENT_LENGTH]: U.getByteSize(data),
        [C.HEADER_CONTENT_TYPE]: fileType,
        ...additionalHeaders,
        ...ssecHeaders,
      },
      tolerated: [200],
    })
  }

  /** Initiates a multipart upload and returns the upload ID. */
  public async getMultipartUploadId(
    key: string,
    fileType: string = C.DEFAULT_STREAM_CONTENT_TYPE,
    ssecHeaders?: IT.SSECHeaders,
  ): Promise<string> {
    this._checkKey(key)
    if (typeof fileType !== 'string') {
      throw new TypeError(`${C.ERROR_PREFIX}fileType must be a string`)
    }
    const query = { uploads: '' }
    const headers = { [C.HEADER_CONTENT_TYPE]: fileType, ...ssecHeaders }

    const res = await this._signedRequest('POST', key, {
      query,
      headers,
      withQuery: true,
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

  /** Uploads a part in a multipart upload. Returns the part number and ETag. */
  public async uploadPart(
    key: string,
    uploadId: string,
    data: IT.BinaryData | string,
    partNumber: number,
    opts: Record<string, unknown> = {},
    ssecHeaders?: IT.SSECHeaders,
  ): Promise<IT.UploadPart> {
    const body = this._validateUploadPartParams(
      key,
      uploadId,
      data,
      partNumber,
      opts,
    )

    const query = { uploadId, partNumber, ...opts }
    const res = await this._signedRequest('PUT', key, {
      query,
      body,
      headers: {
        [C.HEADER_CONTENT_LENGTH]: U.getByteSize(data),
        ...ssecHeaders,
      },
    })

    return { partNumber, etag: U.sanitizeETag(res.headers.get('etag') || '') }
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
    const query = { uploadId }

    const res = await this._signedRequest('GET', key, {
      query,
      withQuery: true,
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
    const query = { uploadId }
    const xmlBody = this._buildCompleteMultipartUploadXml(parts)
    const headers = {
      [C.HEADER_CONTENT_TYPE]: C.XML_CONTENT_TYPE,
      [C.HEADER_CONTENT_LENGTH]: U.getByteSize(xmlBody),
    }

    const res = await this._signedRequest('POST', key, {
      query,
      body: xmlBody,
      headers,
      withQuery: true,
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
    ssecHeaders?: IT.SSECHeaders,
  ): Promise<object> {
    this._checkKey(key)
    if (!uploadId) {
      throw new TypeError(C.ERROR_UPLOAD_ID_REQUIRED)
    }

    const query = { uploadId }
    const headers = {
      [C.HEADER_CONTENT_TYPE]: C.XML_CONTENT_TYPE,
      ...(ssecHeaders ? { ...ssecHeaders } : {}),
    }

    const res = await this._signedRequest('DELETE', key, {
      query,
      headers,
      withQuery: true,
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
    const res = await this._signedRequest('DELETE', key, {
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

  private async _sendRequest(
    url: string,
    method: IT.HttpMethod,
    headers: Record<string, string>,
    body?: BodyInit,
    toleratedStatusCodes: number[] = [],
  ): Promise<Response> {
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
