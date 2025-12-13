/** Request data to be signed */
export type signableRequest = {
  method: string
  url: string
  headers: Record<string, string>
  body?: BodyInit | null
}

/** Headers returned after signing */
export type signedHeaders = Record<string, string>

/** Function that signs a request and returns the signed headers */
export type signRequestFn = (request: signableRequest) => Promise<signedHeaders>

/** Configuration options for S3mini client */
export interface S3Config {
  /** Endpoint URL of the S3-compatible service (e.g., 'https://s3.amazonaws.com/bucket-name') */
  endpoint: string
  /** Function to sign requests. Called for each S3 API request. */
  signRequest: signRequestFn
  /** AWS region. Defaults to 'auto'. */
  region?: string
  /** Request size in bytes for multipart uploads. Defaults to 8MB. */
  requestSizeInBytes?: number
  /** Timeout in ms after which a request should be aborted. */
  requestAbortTimeout?: number
  /** Custom fetch implementation. Defaults to globalThis.fetch. */
  fetch?: typeof fetch
}

export interface SSECHeaders {
  'x-amz-server-side-encryption-customer-algorithm': string
  'x-amz-server-side-encryption-customer-key': string
  'x-amz-server-side-encryption-customer-key-md5': string
}

export interface AWSHeaders {
  [k: `x-amz-${string}`]: string
}

export interface UploadPart {
  partNumber: number
  etag: string
}

export interface CompleteMultipartUploadResult {
  location: string
  bucket: string
  key: string
  etag: string
  eTag: string // for backward compatibility
  ETag: string // for backward compatibility
}

export interface ListMultipartUploadSuccess {
  listMultipartUploadsResult: {
    bucket: string
    key: string
    uploadId: string
    size?: number
    mtime?: Date
    etag?: string
    eTag?: string // for backward compatibility
    parts: UploadPart[]
    isTruncated: boolean
    uploads: UploadPart[]
  }
}

export interface MultipartUploadError {
  error: {
    code: string
    message: string
  }
}

export interface ErrorWithCode {
  code?: string
  cause?: { code?: string }
}

export type ListMultipartUploadResponse =
  | ListMultipartUploadSuccess
  | MultipartUploadError

export type HttpMethod = 'POST' | 'GET' | 'HEAD' | 'PUT' | 'DELETE'

export type XmlValue = string | XmlMap | boolean | number | null
export interface XmlMap {
  [key: string]: XmlValue | XmlValue[] // one or many children
  [key: number]: XmlValue | XmlValue[] // allow numeric keys
}

/**
 * Binary data types supported in browser environments.
 * Use ArrayBuffer or Uint8Array - Buffer is not available in browsers.
 */
export type BinaryData = ArrayBuffer | Uint8Array
