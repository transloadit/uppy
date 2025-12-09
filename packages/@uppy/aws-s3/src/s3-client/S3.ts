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
  readonly bucketName: string
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
    this.bucketName = this._extractBucketName()
    this.requestSizeInBytes = requestSizeInBytes
    this.requestAbortTimeout = requestAbortTimeout
    this.fetch = fetch
  }

  private _sanitize(obj: unknown): unknown {
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }
    return Object.keys(obj).reduce(
      (acc: Record<string, unknown>, key) => {
        if (C.SENSITIVE_KEYS_REDACTED.has(key.toLowerCase())) {
          acc[key] = '[REDACTED]'
        } else if (
          typeof (obj as Record<string, unknown>)[key] === 'object' &&
          (obj as Record<string, unknown>)[key] !== null
        ) {
          acc[key] = this._sanitize((obj as Record<string, unknown>)[key])
        } else {
          acc[key] = (obj as Record<string, unknown>)[key]
        }
        return acc
      },
      Array.isArray(obj) ? [] : {},
    )
  }

  // ! MODIFIED
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

  private _validateMethodIsGetOrHead(method: string): void {
    if (method !== 'GET' && method !== 'HEAD') {
      throw new Error(`${C.ERROR_PREFIX}method must be either GET or HEAD`)
    }
  }

  private _checkKey(key: string): void {
    if (typeof key !== 'string' || key.trim().length === 0) {
      throw new TypeError(C.ERROR_KEY_REQUIRED)
    }
  }

  private _checkDelimiter(delimiter: string): void {
    if (typeof delimiter !== 'string' || delimiter.trim().length === 0) {
      throw new TypeError(C.ERROR_DELIMITER_REQUIRED)
    }
  }

  private _checkPrefix(prefix: string): void {
    if (typeof prefix !== 'string') {
      throw new TypeError(C.ERROR_PREFIX_TYPE)
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

  // ! MODIFIED
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

  // ! MODIFIED
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
   * Sanitizes an ETag value by removing surrounding quotes and whitespace.
   * Still returns RFC compliant ETag. https://www.rfc-editor.org/rfc/rfc9110#section-8.8.3
   * @param {string} etag - The ETag value to sanitize.
   * @returns {string} The sanitized ETag value.
   * @example
   * const cleanEtag = s3.sanitizeETag('"abc123"'); // Returns: 'abc123'
   */
  public sanitizeETag(etag: string): string {
    return U.sanitizeETag(etag)
  }

  // ! BUCKET METHOD
  private _extractBucketName(): string {
    const url = this.endpoint

    // First check if bucket is in the pathname (path-style URLs)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    if (pathSegments.length > 0) {
      if (typeof pathSegments[0] === 'string') {
        return pathSegments[0]
      }
    }

    // Otherwise extract from subdomain (virtual-hosted-style URLs)
    const hostParts = url.hostname.split('.')

    // Common patterns:
    // bucket-name.s3.amazonaws.com
    // bucket-name.s3.region.amazonaws.com
    // bucket-name.region.digitaloceanspaces.com
    // bucket-name.region.cdn.digitaloceanspaces.com

    if (hostParts.length >= 3) {
      // Check if it's a known S3-compatible service
      const domain = hostParts.slice(-2).join('.')
      const knownDomains = [
        'amazonaws.com',
        'digitaloceanspaces.com',
        'cloudflare.com',
      ]

      if (knownDomains.some((d) => domain.includes(d))) {
        if (typeof hostParts[0] === 'string') {
          return hostParts[0]
        }
      }
    }

    // Fallback: use the first subdomain
    return hostParts[0] || ''
  }

  /**
   * Checks if a bucket exists.
   * This method sends a request to check if the specified bucket exists in the S3-compatible service.
   * @returns A promise that resolves to true if the bucket exists, false otherwise.
   */
  // ! BUCKET METHOD
  public async bucketExists(): Promise<boolean> {
    const res = await this._signedRequest('HEAD', '', {
      tolerated: [200, 404, 403],
    })
    return res.status === 200
  }

  /**
   * Lists objects in the bucket with optional filtering and no pagination.
   * This method retrieves all objects matching the criteria (not paginated like listObjectsV2).
   * @param {string} [delimiter='/'] - The delimiter to use for grouping objects.
   * @param {string} [prefix=''] - The prefix to filter objects by.
   * @param {number} [maxKeys] - The maximum number of keys to return. If not provided, all keys will be returned.
   * @param {Record<string, unknown>} [opts={}] - Additional options for the request.
   * @returns {Promise<IT.ListObject[] | null>} A promise that resolves to an array of objects or null if the bucket is empty.
   * @example
   * // List all objects
   * const objects = await s3.listObjects();
   *
   * // List objects with prefix
   * const photos = await s3.listObjects('/', 'photos/', 100);
   */
  // ! BUCKET METHOD
  public async listObjects(
    delimiter: string = '/',
    prefix: string = '',
    maxKeys?: number,
    opts: Record<string, unknown> = {},
  ): Promise<IT.ListObject[] | null> {
    this._checkDelimiter(delimiter)
    this._checkPrefix(prefix)
    this._checkOpts(opts)

    const keyPath = delimiter === '/' ? delimiter : U.uriEscape(delimiter)
    const unlimited = !(maxKeys && maxKeys > 0)
    let remaining = unlimited ? Infinity : maxKeys
    let token: string | undefined
    const all: IT.ListObject[] = []

    do {
      const batchResult = await this._fetchObjectBatch(
        keyPath,
        prefix,
        remaining,
        token,
        opts,
      )

      if (batchResult === null) {
        return null // 404 - bucket not found
      }

      all.push(...batchResult.objects)

      if (!unlimited) {
        remaining -= batchResult.objects.length
      }

      token = batchResult.continuationToken
    } while (token && remaining > 0)

    return all
  }

  private async _fetchObjectBatch(
    keyPath: string,
    prefix: string,
    remaining: number,
    token: string | undefined,
    opts: Record<string, unknown>,
  ): Promise<{ objects: IT.ListObject[]; continuationToken?: string } | null> {
    const query = this._buildListObjectsQuery(prefix, remaining, token, opts)

    const res = await this._signedRequest('GET', keyPath, {
      query,
      withQuery: true,
      tolerated: [200, 404],
    })

    if (res.status === 404) {
      return null
    }

    if (res.status !== 200) {
      await this._handleListObjectsError(res)
    }

    const xmlText = await res.text()
    return this._parseListObjectsResponse(xmlText)
  }

  private _buildListObjectsQuery(
    prefix: string,
    remaining: number,
    token: string | undefined,
    opts: Record<string, unknown>,
  ): Record<string, unknown> {
    const batchSize = Math.min(remaining, 1000) // S3 ceiling

    return {
      'list-type': C.LIST_TYPE, // =2 for V2
      'max-keys': String(batchSize),
      ...(prefix ? { prefix } : {}),
      ...(token ? { 'continuation-token': token } : {}),
      ...opts,
    }
  }

  private async _handleListObjectsError(res: Response): Promise<never> {
    const errorBody = await res.text()
    const parsedErrorBody = this._parseErrorXml(res.headers, errorBody)
    const errorCode =
      res.headers.get('x-amz-error-code') ??
      parsedErrorBody.svcCode ??
      'Unknown'
    const errorMessage =
      res.headers.get('x-amz-error-message') ??
      parsedErrorBody.errorMessage ??
      res.statusText

    throw new Error(
      `${C.ERROR_PREFIX}Request failed with status ${res.status}: ${errorCode} - ${errorMessage}, err body: ${errorBody}`,
    )
  }

  private _parseListObjectsResponse(xmlText: string): {
    objects: IT.ListObject[]
    continuationToken?: string
  } {
    const raw = U.parseXml(xmlText) as Record<string, unknown>

    if (typeof raw !== 'object' || !raw || 'error' in raw) {
      throw new Error(`${C.ERROR_PREFIX}Unexpected listObjects response shape`)
    }

    const out = (raw.ListBucketResult || raw.listBucketResult || raw) as Record<
      string,
      unknown
    >
    const objects = this._extractObjectsFromResponse(out)
    const continuationToken = this._extractContinuationToken(out)

    return { objects, continuationToken }
  }

  private _extractObjectsFromResponse(
    response: Record<string, unknown>,
  ): IT.ListObject[] {
    const contents = response.Contents || response.contents // S3 v2 vs v1

    if (!contents) {
      return []
    }

    return Array.isArray(contents)
      ? (contents as IT.ListObject[])
      : [contents as IT.ListObject]
  }

  private _extractContinuationToken(
    response: Record<string, unknown>,
  ): string | undefined {
    const truncated =
      response.IsTruncated === 'true' ||
      response.isTruncated === 'true' ||
      false

    if (!truncated) {
      return undefined
    }

    return (response.NextContinuationToken ||
      response.nextContinuationToken ||
      response.NextMarker ||
      response.nextMarker) as string | undefined
  }

  /**
   * Lists multipart uploads in the bucket.
   * This method sends a request to list multipart uploads in the specified bucket.
   * @param {string} [delimiter='/'] - The delimiter to use for grouping uploads.
   * @param {string} [prefix=''] - The prefix to filter uploads by.
   * @param {IT.HttpMethod} [method='GET'] - The HTTP method to use for the request (GET or HEAD).
   * @param {Record<string, string | number | boolean | undefined>} [opts={}] - Additional options for the request.
   * @returns A promise that resolves to a list of multipart uploads or an error.
   */
  public async listMultipartUploads(
    delimiter: string = '/',
    prefix: string = '',
    method: IT.HttpMethod = 'GET',
    opts: Record<string, string | number | boolean | undefined> = {},
  ): Promise<IT.ListMultipartUploadSuccess | IT.MultipartUploadError> {
    this._checkDelimiter(delimiter)
    this._checkPrefix(prefix)
    this._validateMethodIsGetOrHead(method)
    this._checkOpts(opts)

    const query = { uploads: '', ...opts }
    const keyPath = delimiter === '/' ? delimiter : U.uriEscape(delimiter)

    const res = await this._signedRequest(method, keyPath, {
      query,
      withQuery: true,
    })
    // doublecheck if this is needed
    // if (method === 'HEAD') {
    //   return {
    //     size: +(res.headers.get(C.HEADER_CONTENT_LENGTH) ?? '0'),
    //     mtime: res.headers.get(C.HEADER_LAST_MODIFIED) ? new Date(res.headers.get(C.HEADER_LAST_MODIFIED)!) : undefined,
    //     etag: res.headers.get(C.HEADER_ETAG) ?? '',
    //   };
    // }
    const raw = U.parseXml(await res.text()) as unknown
    if (typeof raw !== 'object' || raw === null) {
      throw new Error(
        `${C.ERROR_PREFIX}Unexpected listMultipartUploads response shape`,
      )
    }
    if ('listMultipartUploadsResult' in raw) {
      return raw.listMultipartUploadsResult as IT.ListMultipartUploadSuccess
    }
    return raw as IT.MultipartUploadError
  }

  /**
   * Get an object from the S3-compatible service.
   * This method sends a request to retrieve the specified object from the S3-compatible service.
   * @param {string} key - The key of the object to retrieve.
   * @param {Record<string, unknown>} [opts] - Additional options for the request.
   * @param {IT.SSECHeaders} [ssecHeaders] - Server-Side Encryption headers, if any.
   * @returns A promise that resolves to the object data (string) or null if not found.
   */
  public async getObject(
    key: string,
    opts: Record<string, unknown> = {},
    ssecHeaders?: IT.SSECHeaders,
  ): Promise<string | null> {
    // if ssecHeaders is set, add it to headers
    const res = await this._signedRequest('GET', key, {
      query: opts, // use opts.query if it exists, otherwise use an empty object
      tolerated: [200, 404, 412, 304],
      headers: ssecHeaders ? { ...ssecHeaders } : undefined,
    })
    if ([404, 412, 304].includes(res.status)) {
      return null
    }
    return res.text()
  }

  /**
   * Get an object response from the S3-compatible service.
   * This method sends a request to retrieve the specified object and returns the full response.
   * @param {string} key - The key of the object to retrieve.
   * @param {Record<string, unknown>} [opts={}] - Additional options for the request.
   * @param {IT.SSECHeaders} [ssecHeaders] - Server-Side Encryption headers, if any.
   * @returns A promise that resolves to the Response object or null if not found.
   */
  public async getObjectResponse(
    key: string,
    opts: Record<string, unknown> = {},
    ssecHeaders?: IT.SSECHeaders,
  ): Promise<Response | null> {
    const res = await this._signedRequest('GET', key, {
      query: opts,
      tolerated: [200, 404, 412, 304],
      headers: ssecHeaders ? { ...ssecHeaders } : undefined,
    })
    if ([404, 412, 304].includes(res.status)) {
      return null
    }
    return res
  }

  /**
   * Get an object as an ArrayBuffer from the S3-compatible service.
   * This method sends a request to retrieve the specified object and returns it as an ArrayBuffer.
   * @param {string} key - The key of the object to retrieve.
   * @param {Record<string, unknown>} [opts={}] - Additional options for the request.
   * @param {IT.SSECHeaders} [ssecHeaders] - Server-Side Encryption headers, if any.
   * @returns A promise that resolves to the object data as an ArrayBuffer or null if not found.
   */
  public async getObjectArrayBuffer(
    key: string,
    opts: Record<string, unknown> = {},
    ssecHeaders?: IT.SSECHeaders,
  ): Promise<ArrayBuffer | null> {
    const res = await this._signedRequest('GET', key, {
      query: opts,
      tolerated: [200, 404, 412, 304],
      headers: ssecHeaders ? { ...ssecHeaders } : undefined,
    })
    if ([404, 412, 304].includes(res.status)) {
      return null
    }
    return res.arrayBuffer()
  }

  /**
   * Get an object as JSON from the S3-compatible service.
   * This method sends a request to retrieve the specified object and returns it as JSON.
   * @param {string} key - The key of the object to retrieve.
   * @param {Record<string, unknown>} [opts={}] - Additional options for the request.
   * @param {IT.SSECHeaders} [ssecHeaders] - Server-Side Encryption headers, if any.
   * @returns A promise that resolves to the object data as JSON or null if not found.
   */
  public async getObjectJSON<T = unknown>(
    key: string,
    opts: Record<string, unknown> = {},
    ssecHeaders?: IT.SSECHeaders,
  ): Promise<T | null> {
    const res = await this._signedRequest('GET', key, {
      query: opts,
      tolerated: [200, 404, 412, 304],
      headers: ssecHeaders ? { ...ssecHeaders } : undefined,
    })
    if ([404, 412, 304].includes(res.status)) {
      return null
    }
    return res.json() as Promise<T>
  }

  /**
   * Get an object with its ETag from the S3-compatible service.
   * This method sends a request to retrieve the specified object and its ETag.
   * @param {string} key - The key of the object to retrieve.
   * @param {Record<string, unknown>} [opts={}] - Additional options for the request.
   * @param {IT.SSECHeaders} [ssecHeaders] - Server-Side Encryption headers, if any.
   * @returns A promise that resolves to an object containing the ETag and the object data as an ArrayBuffer or null if not found.
   */
  public async getObjectWithETag(
    key: string,
    opts: Record<string, unknown> = {},
    ssecHeaders?: IT.SSECHeaders,
  ): Promise<{ etag: string | null; data: ArrayBuffer | null }> {
    const res = await this._signedRequest('GET', key, {
      query: opts,
      tolerated: [200, 404, 412, 304],
      headers: ssecHeaders ? { ...ssecHeaders } : undefined,
    })

    if ([404, 412, 304].includes(res.status)) {
      return { etag: null, data: null }
    }

    const etag = res.headers.get(C.HEADER_ETAG)
    if (!etag) {
      throw new Error(`${C.ERROR_PREFIX}ETag not found in response headers`)
    }
    return { etag: U.sanitizeETag(etag), data: await res.arrayBuffer() }
  }

  /**
   * Get an object as a raw response from the S3-compatible service.
   * This method sends a request to retrieve the specified object and returns the raw response.
   * @param {string} key - The key of the object to retrieve.
   * @param {boolean} [wholeFile=true] - Whether to retrieve the whole file or a range.
   * @param {number} [rangeFrom=0] - The starting byte for the range (if not whole file).
   * @param {number} [rangeTo=this.requestSizeInBytes] - The ending byte for the range (if not whole file).
   * @param {Record<string, unknown>} [opts={}] - Additional options for the request.
   * @param {IT.SSECHeaders} [ssecHeaders] - Server-Side Encryption headers, if any.
   * @returns A promise that resolves to the Response object.
   */
  public async getObjectRaw(
    key: string,
    wholeFile = true,
    rangeFrom = 0,
    rangeTo = this.requestSizeInBytes,
    opts: Record<string, unknown> = {},
    ssecHeaders?: IT.SSECHeaders,
  ): Promise<Response> {
    const rangeHdr: Record<string, string | number> = wholeFile
      ? {}
      : { range: `bytes=${rangeFrom}-${rangeTo - 1}` }

    return this._signedRequest('GET', key, {
      query: { ...opts },
      headers: { ...rangeHdr, ...ssecHeaders },
      withQuery: true, // keep ?query=string behaviour
    })
  }

  /**
   * Get the content length of an object.
   * This method sends a HEAD request to retrieve the content length of the specified object.
   * @param {string} key - The key of the object to retrieve the content length for.
   * @returns A promise that resolves to the content length of the object in bytes, or 0 if not found.
   * @throws {Error} If the content length header is not found in the response.
   */
  public async getContentLength(
    key: string,
    ssecHeaders?: IT.SSECHeaders,
  ): Promise<number> {
    try {
      const res = await this._signedRequest('HEAD', key, {
        headers: ssecHeaders ? { ...ssecHeaders } : undefined,
      })
      const len = res.headers.get(C.HEADER_CONTENT_LENGTH)
      return len ? +len : 0
    } catch (err) {
      throw new Error(
        `${C.ERROR_PREFIX}Error getting content length for object ${key}: ${String(err)}`,
      )
    }
  }

  /**
   * Checks if an object exists in the S3-compatible service.
   * This method sends a HEAD request to check if the specified object exists.
   * @param {string} key - The key of the object to check.
   * @param {Record<string, unknown>} [opts={}] - Additional options for the request.
   * @returns A promise that resolves to true if the object exists, false if not found, or null if ETag mismatch.
   */
  public async objectExists(
    key: string,
    opts: Record<string, unknown> = {},
  ): Promise<IT.ExistResponseCode> {
    const res = await this._signedRequest('HEAD', key, {
      query: opts,
      tolerated: [200, 404, 412, 304],
    })

    if (res.status === 404) {
      return false // not found
    }
    if (res.status === 412 || res.status === 304) {
      return null // ETag mismatch
    }
    return true // found (200)
  }

  /**
   * Retrieves the ETag of an object without downloading its content.
   * @param {string} key - The key of the object to retrieve the ETag for.
   * @param {Record<string, unknown>} [opts={}] - Additional options for the request.
   * @param {IT.SSECHeaders} [ssecHeaders] - Server-Side Encryption headers, if any.
   * @returns {Promise<string | null>} A promise that resolves to the ETag value or null if the object is not found.
   * @throws {Error} If the ETag header is not found in the response.
   * @example
   * const etag = await s3.getEtag('path/to/file.txt');
   * if (etag) {
   *   console.log(`File ETag: ${etag}`);
   * }
   */
  public async getEtag(
    key: string,
    opts: Record<string, unknown> = {},
    ssecHeaders?: IT.SSECHeaders,
  ): Promise<string | null> {
    const res = await this._signedRequest('HEAD', key, {
      query: opts,
      tolerated: [200, 304, 404, 412],
      headers: ssecHeaders ? { ...ssecHeaders } : undefined,
    })

    if (res.status === 404) {
      return null
    }

    if (res.status === 412 || res.status === 304) {
      return null // ETag mismatch
    }

    const etag = res.headers.get(C.HEADER_ETAG)
    if (!etag) {
      throw new Error(`${C.ERROR_PREFIX}ETag not found in response headers`)
    }

    return U.sanitizeETag(etag)
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
      `${C.ERROR_PREFIX}Failed to create multipart upload: ${JSON.stringify(parsed)}`,
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
      `${C.ERROR_PREFIX}Failed to complete multipart upload: ${JSON.stringify(parsed)}`,
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
        `${C.ERROR_PREFIX}Failed to abort multipart upload: ${String(parsed.error.message)}`,
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

  private async _deleteObjectsProcess(keys: string[]): Promise<boolean[]> {
    const objectsXml = keys
      .map((key) => `<Object><Key>${U.escapeXml(key)}</Key></Object>`)
      .join('')
    const xmlBody = `<Delete>${objectsXml}</Delete>`
    const query = { delete: '' }
    const sha256base64 = U.base64FromBuffer(await U.sha256(xmlBody))
    const headers = {
      [C.HEADER_CONTENT_TYPE]: C.XML_CONTENT_TYPE,
      [C.HEADER_CONTENT_LENGTH]: U.getByteSize(xmlBody),
      [C.HEADER_AMZ_CHECKSUM_SHA256]: sha256base64,
    }

    const res = await this._signedRequest('POST', '', {
      query,
      body: xmlBody,
      headers,
      withQuery: true,
    })
    const parsed = U.parseXml(await res.text()) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object') {
      throw new Error(
        `${C.ERROR_PREFIX}Failed to delete objects: ${JSON.stringify(parsed)}`,
      )
    }
    const out = (parsed.DeleteResult ||
      parsed.deleteResult ||
      parsed) as Record<string, unknown>
    const resultMap = new Map<string, boolean>()
    for (const key of keys) {
      resultMap.set(key, false)
    }
    const deleted = out.deleted || out.Deleted
    if (deleted) {
      const deletedArray = Array.isArray(deleted) ? deleted : [deleted]
      for (const item of deletedArray) {
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>
          // Check both key and Key
          const key = obj.key || obj.Key
          if (key && typeof key === 'string') {
            resultMap.set(key, true)
          }
        }
      }
    }

    // Handle errors (check both cases)
    const errors = out.error || out.Error
    if (errors) {
      const errorsArray = Array.isArray(errors) ? errors : [errors]
      for (const item of errorsArray) {
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>
          // Check both cases for all properties
          const key = obj.key || obj.Key

          if (key && typeof key === 'string') {
            resultMap.set(key, false)
          }
        }
      }
    }

    // Return boolean array in the same order as input keys
    return keys.map((key) => resultMap.get(key) || false)
  }

  /**
   * Deletes multiple objects from the bucket.
   * @param {string[]} keys - An array of object keys to delete.
   * @returns A promise that resolves to an array of booleans indicating success for each key in order.
   */
  public async deleteObjects(keys: string[]): Promise<boolean[]> {
    if (!Array.isArray(keys) || keys.length === 0) {
      return []
    }
    const maxBatchSize = 1000 // S3 limit for delete batch size
    if (keys.length > maxBatchSize) {
      const allPromises = []
      for (let i = 0; i < keys.length; i += maxBatchSize) {
        const batch = keys.slice(i, i + maxBatchSize)
        allPromises.push(this._deleteObjectsProcess(batch))
      }
      const results = await Promise.all(allPromises)
      // Flatten the results array
      return results.flat()
    } else {
      return await this._deleteObjectsProcess(keys)
    }
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
