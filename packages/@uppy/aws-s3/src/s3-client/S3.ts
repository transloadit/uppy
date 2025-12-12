import * as C from './consts.js'
import type * as IT from './types.js'
import * as U from './utils.js'

/**
 * S3 class for interacting with S3-compatible object storage services.
 * This class provides methods for common S3 operations such as uploading, downloading,
 * and deleting objects, as well as multipart uploads.
 *
 * @class
 * @example
 * const s3 = new CoreS3({
 *   accessKeyId: 'your-access-key',
 *   secretAccessKey: 'your-secret-key',
 *   endpoint: 'https://your-s3-endpoint.com/bucket-name',
 *   region: 'auto' // by default is auto
 * });
 *
 * // Upload a file
 * await s3.putObject('example.txt', 'Hello, World!');
 *
 * // Download a file
 * const content = await s3.getObject('example.txt');
 *
 * // Delete a file
 * await s3.deleteObject('example.txt');
 */
class S3mini {
  /**
   * Creates an instance of the S3 class.
   *
   * @constructor
   * @param {Object} config - Configuration options for the S3 instance.
   * @param {string} config.accessKeyId - The access key ID for authentication.
   * @param {string} config.secretAccessKey - The secret access key for authentication.
   * @param {string} config.endpoint - The endpoint URL of the S3-compatible service.
   * @param {string} [config.region='auto'] - The region of the S3 service.
   * @param {number} [config.requestSizeInBytes=8388608] - The request size of a single request in bytes (AWS S3 is 8MB).
   * @param {number} [config.requestAbortTimeout=undefined] - The timeout in milliseconds after which a request should be aborted (careful on streamed requests).
   * @param {Object} [config.logger=null] - A logger object with methods like info, warn, error.
   * @param {typeof fetch} [config.fetch=globalThis.fetch] - Custom fetch implementation to use for HTTP requests.
   * @throws {TypeError} Will throw an error if required parameters are missing or of incorrect type.
   */
  readonly endpoint: URL
  readonly region: string
  readonly requestSizeInBytes: number
  readonly requestAbortTimeout?: number
  readonly fetch: typeof fetch
  readonly signRequest: IT.signRequestFn

  constructor({
    endpoint,
    signRequest,
    region = 'auto',
    requestSizeInBytes = C.DEFAULT_REQUEST_SIZE_IN_BYTES,
    requestAbortTimeout = undefined,
    fetch = globalThis.fetch,
  }: IT.S3Config) {
    this._validateConstructorParams(endpoint, signRequest)
    this.endpoint = new URL(this._ensureValidUrl(endpoint))
    this.signRequest = signRequest
    this.region = region
    this.requestSizeInBytes = requestSizeInBytes
    this.requestAbortTimeout = requestAbortTimeout
    // Bind fetch to globalThis to preserve correct 'this' context in browsers
    // Without this, calling this.fetch() throws "Illegal invocation"
    this.fetch = fetch.bind(globalThis)
  }

  private _validateConstructorParams(
    endpoint: string,
    signRequest: IT.signRequestFn,
  ): void {
    if (typeof endpoint !== 'string' || endpoint.trim().length === 0) {
      throw new TypeError(C.ERROR_ENDPOINT_REQUIRED)
    }

    if (typeof signRequest !== 'function') {
      throw new TypeError('signRequest is not passed')
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
      if (C.IFHEADERS.has(key.toLowerCase())) {
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
    data: IT.MaybeBuffer | string,
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

    // call the singedRequest callback
    const signedHeaders = await this.signRequest({
      method,
      url: finalUrl.toString(),
      headers: baseHeaders,
    })

    return this._sendRequest(
      finalUrl.toString(),
      method,
      signedHeaders,
      body,
      tolerated,
    )
  }

  /**
   * Uploads an object to the S3-compatible service.
   * @param {string} key - The key/path where the object will be stored.
   * @param {string | Buffer} data - The data to upload (string or Buffer).
   * @param {string} [fileType='application/octet-stream'] - The MIME type of the file.
   * @param {IT.SSECHeaders} [ssecHeaders] - Server-Side Encryption headers, if any.
   * @param {IT.AWSHeaders} [additionalHeaders] - Additional x-amz-* headers specific to this request, if any.
   * @returns {Promise<Response>} A promise that resolves to the Response object from the upload request.
   * @throws {TypeError} If data is not a string or Buffer.
   * @example
   * // Upload text file
   * await s3.putObject('hello.txt', 'Hello, World!', 'text/plain');
   *
   * // Upload binary data
   * const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
   * await s3.putObject('image.png', buffer, 'image/png');
   */
  public async putObject(
    key: string,
    data: string | IT.MaybeBuffer,
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

  /**
   * Initiates a multipart upload and returns the upload ID.
   * @param {string} key - The key/path where the object will be stored.
   * @param {string} [fileType='application/octet-stream'] - The MIME type of the file.
   * @param {IT.SSECHeaders?} [ssecHeaders] - Server-Side Encryption headers, if any.
   * @returns {Promise<string>} A promise that resolves to the upload ID for the multipart upload.
   * @throws {TypeError} If key is invalid or fileType is not a string.
   * @throws {Error} If the multipart upload fails to initialize.
   * @example
   * const uploadId = await s3.getMultipartUploadId('large-file.zip', 'application/zip');
   * console.log(`Started multipart upload: ${uploadId}`);
   */
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

  /**
   * Uploads a part in a multipart upload.
   * @param {string} key - The key of the object being uploaded.
   * @param {string} uploadId - The upload ID from getMultipartUploadId.
   * @param {Buffer | string} data - The data for this part.
   * @param {number} partNumber - The part number (must be between 1 and 10,000).
   * @param {Record<string, unknown>} [opts={}] - Additional options for the request.
   * @param {IT.SSECHeaders} [ssecHeaders] - Server-Side Encryption headers, if any.
   * @returns {Promise<IT.UploadPart>} A promise that resolves to an object containing the partNumber and etag.
   * @throws {TypeError} If any parameter is invalid.
   * @example
   * const part = await s3.uploadPart(
   *   'large-file.zip',
   *   uploadId,
   *   partData,
   *   1
   * );
   * console.log(`Part ${part.partNumber} uploaded with ETag: ${part.etag}`);
   */
  public async uploadPart(
    key: string,
    uploadId: string,
    data: IT.MaybeBuffer | string,
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

  // takes in uploadID and returns the parts which were uploaded
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

  /**
   * Completes a multipart upload by combining all uploaded parts.
   * @param {string} key - The key of the object being uploaded.
   * @param {string} uploadId - The upload ID from getMultipartUploadId.
   * @param {Array<IT.UploadPart>} parts - Array of uploaded parts with partNumber and etag.
   * @returns {Promise<IT.CompleteMultipartUploadResult>} A promise that resolves to the completion result containing the final ETag.
   * @throws {Error} If the multipart upload fails to complete.
   * @example
   * const result = await s3.completeMultipartUpload(
   *   'large-file.zip',
   *   uploadId,
   *   [
   *     { partNumber: 1, etag: 'abc123' },
   *     { partNumber: 2, etag: 'def456' }
   *   ]
   * );
   * console.log(`Upload completed with ETag: ${result.etag}`);
   */
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

  /**
   * Aborts a multipart upload and removes all uploaded parts.
   * @param {string} key - The key of the object being uploaded.
   * @param {string} uploadId - The upload ID to abort.
   * @param {IT.SSECHeaders} [ssecHeaders] - Server-Side Encryption headers, if any.
   * @returns {Promise<object>} A promise that resolves to an object containing the abort status and details.
   * @throws {TypeError} If key or uploadId is invalid.
   * @throws {Error} If the abort operation fails.
   * @example
   * try {
   *   const result = await s3.abortMultipartUpload('large-file.zip', uploadId);
   *   console.log('Upload aborted:', result.status);
   * } catch (error) {
   *   console.error('Failed to abort upload:', error);
   * }
   */
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

  /**
   * Deletes an object from the bucket.
   * This method sends a request to delete the specified object from the bucket.
   * @param {string} key - The key of the object to delete.
   * @returns A promise that resolves to true if the object was deleted successfully, false otherwise.
   */
  public async deleteObject(key: string): Promise<boolean> {
    const res = await this._signedRequest('DELETE', key, {
      tolerated: [200, 204],
    })
    return res.status === 200 || res.status === 204
  }

  private async _sendRequest(
    url: string,
    method: IT.HttpMethod,
    headers: Record<string, string>,
    body?: BodyInit,
    toleratedStatusCodes: number[] = [],
  ): Promise<Response> {
    try {
      const res = await this.fetch(url, {
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
