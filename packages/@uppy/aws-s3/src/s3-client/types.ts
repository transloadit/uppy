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
export type PresignedResponse = {
  url: string
}

/** Function that generates a pre-signed URL for a request */
export type SignRequestFn = (
  request: PresignableRequest,
) => Promise<PresignedResponse>

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

/** Config for the getCredentials callback (region optional). */
type S3ConfigWithGetCredentials = Omit<S3ConfigBase, 'region'> & {
  /** Function to retrieve temporary credentials for client-side signing. */
  getCredentials: GetCredentialsFn
  /** AWS region. Optional; falls back to the getCredentials response or 'auto'. */
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

/** Parameters for {@link S3Client.putObject}. */
export interface PutObjectParams {
  key: string
  data: Blob | File
  fileType?: string
  metadata?: Record<string, unknown>
  onProgress?: OnProgressFn
  signal?: AbortSignal
}

/** Parameters for {@link S3Client.createMultipartUpload}. */
export interface CreateMultipartUploadParams {
  key: string
  fileType?: string
  metadata?: Record<string, unknown>
  signal?: AbortSignal
}

/** Parameters for {@link S3Client.uploadPart}. */
export interface UploadPartParams {
  key: string
  uploadId: string
  data: XMLHttpRequestBodyInit
  partNumber: number
  onProgress?: OnProgressFn
  signal?: AbortSignal
}

/** Parameters for {@link S3Client.listParts}. */
export interface ListPartsParams {
  uploadId: string
  key: string
  signal?: AbortSignal
}

/** Parameters for {@link S3Client.completeMultipartUpload}. */
export interface CompleteMultipartUploadParams {
  key: string
  uploadId: string
  parts: UploadPart[]
  signal?: AbortSignal
}

/** Parameters for {@link S3Client.abortMultipartUpload}. */
export interface AbortMultipartUploadParams {
  key: string
  uploadId: string
  signal?: AbortSignal
}

/** Parameters for {@link S3Client.deleteObject}. */
export interface DeleteObjectParams {
  key: string
  signal?: AbortSignal
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
