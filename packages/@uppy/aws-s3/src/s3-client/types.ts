export interface PresignableRequestBase {
  key: string
  expiresIn?: number
}

export interface PutObjectRequest extends PresignableRequestBase {
  method: 'PUT'
}
export interface DeleteObjectRequest extends PresignableRequestBase {
  method: 'DELETE'
}
export interface CreateMultipartUploadRequest extends PresignableRequestBase {
  method: 'POST'
}
export interface CompleteMultipartUploadRequest extends PresignableRequestBase {
  method: 'POST'
  uploadId: string
}
export interface DeleteMultipartUploadRequest extends PresignableRequestBase {
  method: 'DELETE'
  uploadId: string
}
export interface ListPartsRequest extends PresignableRequestBase {
  method: 'GET'
  uploadId: string
}
export interface UploadPartRequest extends PresignableRequestBase {
  method: 'PUT'
  uploadId: string
  partNumber: number
}

/** Request data to be pre-signed */
export type PresignableRequest =
  | PutObjectRequest
  | DeleteObjectRequest
  | CreateMultipartUploadRequest
  | CompleteMultipartUploadRequest
  | DeleteMultipartUploadRequest
  | ListPartsRequest
  | UploadPartRequest

/** Response with the pre-signed URL */
export type presignedResponse = {
  url: string
}

/** Function that generates a pre-signed URL for a request */
export type SignRequestFn = (
  request: PresignableRequest,
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
export type GetCredentialsFn = (options?: {
  signal?: AbortSignal
}) => CredentialsResponse | Promise<CredentialsResponse>

/** Base configuration shared by both signing approaches */
type S3ConfigBase = {
  /** AWS region. Defaults to 'auto'. */
  region?: string | undefined
  /** Request size in bytes for multipart uploads. Defaults to 8MB. */
  requestSizeInBytes?: number | undefined
  /** Timeout in ms after which a request should be aborted. */
  requestAbortTimeout?: number | undefined
}

/** Config when using signRequest callback (region optional) */
type S3ConfigWithSignRequest = S3ConfigBase & {
  /** Function to sign requests. Called for each S3 API request. */
  signRequest: SignRequestFn
}

/** Config when using getCredentials callback (region required for signing) */
type S3ConfigWithGetCredentials = Omit<S3ConfigBase, 'region'> & {
  /** Function to retrieve temporary credentials for client-side signing. */
  getCredentials: GetCredentialsFn
  /** AWS region. Required for signing with getCredentials. */
  region?: string
  /** Endpoint URL of the S3-compatible service (e.g., 'https://s3.amazonaws.com/bucket-name') */
  endpoint: string
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
}

export interface ErrorWithCode {
  code?: string
  cause?: { code?: string }
}

export type HttpMethod = 'POST' | 'GET' | 'HEAD' | 'PUT' | 'DELETE'

export type XmlValue = string | XmlMap | boolean | number | null
export interface XmlMap {
  [key: string]: XmlValue | XmlValue[] // one or many children
  [key: number]: XmlValue | XmlValue[] // allow numeric keys
}

/**
 * Binary data types supported in browser environments.
 * Use ArrayBuffer, Uint8Array, or Blob - Buffer is not available in browsers.
 */
export type BinaryData = ArrayBuffer | Uint8Array | Blob

/** Progress callback for upload operations */
export type OnProgressFn = (bytesUploaded: number, bytesTotal: number) => void

/** Raw XHR upload response (internal to S3mini) */
export interface XhrUploadResult {
  status: number
  ok: boolean
  headers: {
    get(name: string): string | null
  }
  response: string
}

/** Public result from putObject — includes object location derived from presigned URL */
export interface PutObjectResult extends XhrUploadResult {
  /** Object URL derived from the presigned URL (query string stripped) */
  location: string
}
