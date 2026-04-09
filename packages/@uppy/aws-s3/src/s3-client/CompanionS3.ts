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

  private async _fetch(path: string, opts?: RequestInit) {
    const response = await fetch(`${this.companionEndpoint}/s3${path}`, opts)
    if (!response.ok) {
      throw new Error(`Failed to sign request: ${response.statusText}`)
    }
    return response
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

  public override async putObject(
    keyIn: string,
    data: Blob | File,
    fileType: string = C.DEFAULT_STREAM_CONTENT_TYPE,
    metadata: Record<string, unknown>,
    onProgress?: IT.OnProgressFn,
    signal?: AbortSignal,
  ) {
    const response = await this._fetch(
      `/params?${new URLSearchParams({ filename: keyIn, type: fileType, ...Object.fromEntries(Object.entries(metadata).map(([k, v]) => [`metadata[${k}]`, String(v)])) })}`,
    )
    const { url, fields }: { url: string; fields: Record<string, string> } =
      await response.json()

    const formData = new FormData()
    Object.entries(fields).forEach(([key, value]) => formData.set(key, value))
    formData.set('file', data)

    const xhr = await this._request({
      url,
      method: 'POST',
      data: formData,
      onProgress,
      signal,
    })

    return {
      location: U.removeQueryString(url),
      etag: U.sanitizeETag(xhr.getResponseHeader('etag')),
      key: fields.key,
    }
  }

  public override async createMultipartUpload(
    keyIn: string,
    fileType: string = C.DEFAULT_STREAM_CONTENT_TYPE,
    metadata: Record<string, unknown>,
  ) {
    if (typeof fileType !== 'string') {
      throw new TypeError(`${C.ERROR_PREFIX}fileType must be a string`)
    }

    const method = 'POST'
    const response = await this._fetch('/multipart', {
      method,
      body: JSON.stringify({ filename: keyIn, metadata, type: fileType }),
      headers: { 'content-type': 'application/json' },
    })
    const {
      key,
      uploadId,
    }: { key?: string; uploadId?: string; bucket?: string } =
      await response.json()
    if (uploadId == null) throw new Error('No uploadId returned')
    if (key == null) throw new Error('No key returned')

    return { uploadId, key }
  }

  public override async uploadPart(
    key: string,
    uploadId: string,
    data: XMLHttpRequestBodyInit,
    partNumber: number,
    onProgress?: IT.OnProgressFn,
    signal?: AbortSignal,
  ) {
    const response = await this._fetch(
      `/multipart/${encodeURIComponent(uploadId)}/${encodeURIComponent(partNumber)}?${new URLSearchParams({ key })}`,
      {
        method: 'GET',
      },
    )

    const { url }: { url: string } = await response.json()

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

  public override async listParts(
    uploadId: string,
    key: string,
  ): Promise<IT.UploadPart[]> {
    if (!uploadId) {
      throw new TypeError(C.ERROR_UPLOAD_ID_REQUIRED)
    }

    const response = await this._fetch(
      `/multipart/${encodeURIComponent(uploadId)}?${new URLSearchParams({ key })}`,
      {
        method: 'GET',
      },
    )

    const parts: { PartNumber: string; ETag: string }[] = await response.json()

    return parts.map((p) => ({
      partNumber: parseInt(String(p.PartNumber), 10),
      etag: String(p.ETag),
    }))
  }

  public override async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<IT.UploadPart>,
  ) {
    const response = await this._fetch(
      `/multipart/${encodeURIComponent(uploadId)}/complete?${new URLSearchParams({ key })}`,
      {
        method: 'POST',
        body: JSON.stringify({
          parts: parts.map((part) => ({
            PartNumber: part.partNumber,
            ETag: part.etag,
          })),
        }),
        headers: { 'content-type': 'application/json' },
      },
    )

    const {
      location,
      bucket,
      key: resultKey,
    }: {
      location: string
      bucket?: string
      key: string
    } = await response.json()

    return {
      location,
      bucket,
      key: resultKey,
    }
  }

  public override async abortMultipartUpload(key: string, uploadId: string) {
    await this._fetch(
      `/multipart/${encodeURIComponent(uploadId)}?${new URLSearchParams({ key })}`,
      {
        method: 'DELETE',
      },
    )
  }
}

export default S3Companion
