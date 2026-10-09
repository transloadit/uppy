import * as C from './consts.js'
import S3Client from './S3Client.js'
import type * as IT from './types.js'
import * as U from './utils.js'

/**
 * S3Companion is an S3Client that interacts with a Companion server to perform S3 operations.
 */
class S3Companion extends S3Client {
  readonly companionEndpoint: string

  constructor({
    companionEndpoint,
    requestAbortTimeout,
  }: { companionEndpoint: string; requestAbortTimeout?: number | undefined }) {
    super({ requestAbortTimeout })
    this.companionEndpoint = companionEndpoint
  }

  /**
   * Sends a JSON request to Companion through `_request`, so it gets the same
   * retries, abort and offline handling as the S3 requests themselves.
   */
  private async _fetchJson<T>(
    path: string,
    {
      method = 'GET',
      body,
      signal,
    }: { method?: IT.HttpMethod; body?: unknown; signal?: AbortSignal } = {},
  ): Promise<T> {
    const data = body === undefined ? undefined : JSON.stringify(body)
    const xhr = await this._request({
      url: `${this.companionEndpoint}/s3${path}`,
      method,
      data,
      contentType: data ? 'application/json' : undefined,
      signal,
    }).catch((err) => {
      // Only status 0 is a real network error; anything else is an HTTP
      // error response from Companion and should not be reported as one.
      const { request } = err
      if (!request?.status) throw err
      throw Object.assign(
        new Error(`Companion request failed with status ${request.status}`),
        { request },
      )
    })
    return JSON.parse(xhr.responseText || 'null')
  }

  private async _request({
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
  }): Promise<XMLHttpRequest> {
    // Wait for online before starting
    await this.waitForOnline(signal)

    return this.xhr({ url, method, data, onProgress, signal, contentType })
  }

  public override async putObject({
    key: requestedKey,
    data,
    fileType = C.DEFAULT_STREAM_CONTENT_TYPE,
    metadata = {},
    onProgress,
    signal,
  }: IT.PutObjectParams) {
    const searchParams = new URLSearchParams({
      filename: requestedKey,
      type: fileType,
      ...Object.fromEntries(
        Object.entries(metadata).map(([k, v]) => [`metadata[${k}]`, String(v)]),
      ),
    })
    const { url, fields } = await this._fetchJson<{
      url: string
      fields: Record<string, string>
    }>(`/params?${searchParams}`, { signal })

    await this.waitForOnline(signal)
    return this.postObject({ url, fields, data, onProgress, signal })
  }

  public override async createMultipartUpload({
    key: requestedKey,
    fileType = C.DEFAULT_STREAM_CONTENT_TYPE,
    metadata,
    signal,
  }: IT.CreateMultipartUploadParams) {
    if (typeof fileType !== 'string') {
      throw new TypeError(`${C.ERROR_PREFIX}fileType must be a string`)
    }

    const { key, uploadId } = await this._fetchJson<{
      key?: string
      uploadId?: string
    }>('/multipart', {
      method: 'POST',
      body: { filename: requestedKey, metadata, type: fileType },
      signal,
    })

    if (uploadId == null) throw new Error('No uploadId returned')
    if (key == null) throw new Error('No key returned')

    return { uploadId, key }
  }

  public override async uploadPart({
    key,
    uploadId,
    data,
    partNumber,
    onProgress,
    signal,
  }: IT.UploadPartParams) {
    const { url } = await this._fetchJson<{ url: string }>(
      `/multipart/${encodeURIComponent(uploadId)}/${encodeURIComponent(partNumber)}?${new URLSearchParams({ key })}`,
      { signal },
    )

    const xhr = await this._request({
      url,
      method: 'PUT',
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

  public override async listParts({
    uploadId,
    key,
    signal,
  }: IT.ListPartsParams): Promise<IT.UploadPart[]> {
    if (!uploadId) {
      throw new TypeError(C.ERROR_UPLOAD_ID_REQUIRED)
    }

    const parts = await this._fetchJson<{ PartNumber: string; ETag: string }[]>(
      `/multipart/${encodeURIComponent(uploadId)}?${new URLSearchParams({ key })}`,
      { signal },
    )

    return parts.map((p) => ({
      partNumber: parseInt(String(p.PartNumber), 10),
      etag: String(p.ETag),
    }))
  }

  public override async completeMultipartUpload({
    key,
    uploadId,
    parts,
    signal,
  }: IT.CompleteMultipartUploadParams) {
    const {
      location,
      bucket,
      key: resultKey,
    } = await this._fetchJson<{
      location: string
      bucket?: string
      key: string
    }>(
      `/multipart/${encodeURIComponent(uploadId)}/complete?${new URLSearchParams({ key })}`,
      {
        method: 'POST',
        body: {
          parts: parts.map((part) => ({
            PartNumber: part.partNumber,
            ETag: part.etag,
          })),
        },
        signal,
      },
    )

    return { location, bucket, key: resultKey }
  }

  public override async abortMultipartUpload({
    key,
    uploadId,
    signal,
  }: IT.AbortMultipartUploadParams) {
    await this._fetchJson(
      `/multipart/${encodeURIComponent(uploadId)}?${new URLSearchParams({ key })}`,
      { method: 'DELETE', signal },
    )
  }
}

export default S3Companion
