/** Request data to be pre-signed */
export type presignableRequest = {
  method: string
  key: string
  uploadId?: string
  partNumber?: number
  expiresIn?: number
}

/** Response with the pre-signed URL */
export type presignedResponse = {
  url: string
}

/** Function that generates a pre-signed URL for a request */
export type signRequestFn = (
  request: presignableRequest,
) => Promise<presignedResponse>

/**
 * Temporary security credentials from STS or similar service.
 * These are used with getCredentials callback for client-side signing.
 */
export interface TemporaryCredentials {
  accessKeyId: string
  secretAccessKey: string
  sessionToken: string
  /** ISO 8601 date string when credentials expire */
  expiration?: string
}

/**
 * Response from getCredentials callback.
 * Includes temporary credentials plus region info.
 */
export interface CredentialsResponse {
  credentials: TemporaryCredentials
  region: string
}

/** Function that retrieves temporary credentials */
export type getCredentialsFn = (options?: {
  signal?: AbortSignal
}) => Promise<CredentialsResponse>

/** Base configuration shared by both signing approaches */
type S3ConfigBase = {
  /** Endpoint URL of the S3-compatible service (e.g., 'https://s3.amazonaws.com/bucket-name') */
  endpoint: string
  /** AWS region. Defaults to 'auto'. */
  region?: string
  /** Request size in bytes for multipart uploads. Defaults to 8MB. */
  requestSizeInBytes?: number
  /** Timeout in ms after which a request should be aborted. */
  requestAbortTimeout?: number
}

/** Config when using signRequest callback (region optional) */
type S3ConfigWithSignRequest = S3ConfigBase & {
  /** Function to sign requests. Called for each S3 API request. */
  signRequest: signRequestFn
  getCredentials?: never
}

/** Config when using getCredentials callback (region required for signing) */
type S3ConfigWithGetCredentials = Omit<S3ConfigBase, 'region'> & {
  signRequest?: never
  /** Function to retrieve temporary credentials for client-side signing. */
  getCredentials: getCredentialsFn
  /** AWS region. Required for signing with getCredentials. */
  region: string
}

/** Configuration options for S3mini client */
export type S3Config = S3ConfigWithSignRequest | S3ConfigWithGetCredentials

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
 * Includes Blob for browser file uploads.
 */
export type BinaryData = ArrayBuffer | Uint8Array | Blob
