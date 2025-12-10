export type singableRequest = {
  method: string
  url: string
  headers: Record<string, string>
  body?: BodyInit | null
}

export type singedHeaders = Record<string, string>

export type signRequestFn = (request: singableRequest) => Promise<singedHeaders>

export interface S3Config {
  endpoint: string
  region?: string
  requestSizeInBytes?: number
  requestAbortTimeout?: number
  signRequest: signRequestFn
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

export interface ListObject {
  Key: string
  Size: number
  LastModified: Date
  ETag: string
  StorageClass: string
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

export interface CopyObjectOptions {
  /**
   * Specifies whether the metadata is copied from the source object or replaced with metadata provided in the request.
   * Valid values: 'COPY' | 'REPLACE'
   * Default: 'COPY'
   */
  metadataDirective?: 'COPY' | 'REPLACE'

  /**
   * Metadata to be set on the destination object when metadataDirective is 'REPLACE'.
   * Keys can be provided with or without 'x-amz-meta-' prefix.
   */
  metadata?: Record<string, string>
  contentType?: string

  /**
   * Storage class for the destination object.
   * Valid values: 'STANDARD' | 'REDUCED_REDUNDANCY' | 'STANDARD_IA' | 'ONEZONE_IA' | 'INTELLIGENT_TIERING' | 'GLACIER' | 'DEEP_ARCHIVE' | 'GLACIER_IR'
   */
  storageClass?: string

  /**
   * Specifies whether the object tag-set is copied from the source object or replaced with tag-set provided in the request.
   * Valid values: 'COPY' | 'REPLACE'
   */
  taggingDirective?: 'COPY' | 'REPLACE'

  /**
   * If the bucket is configured as a website, redirects requests for this object to another object or URL.
   */
  websiteRedirectLocation?: string

  /**
   * Server-Side Encryption with Customer-Provided Keys headers for the source object.
   * Should include:
   * - x-amz-copy-source-server-side-encryption-customer-algorithm
   * - x-amz-copy-source-server-side-encryption-customer-key
   * - x-amz-copy-source-server-side-encryption-customer-key-MD5
   */
  sourceSSECHeaders?: Record<string, string | number>
  destinationSSECHeaders?: SSECHeaders
  additionalHeaders?: Record<string, string | number>
}

export interface CopyObjectResult {
  etag: string
  lastModified?: Date
}

/**
 * Where Buffer is available, e.g. when @types/node is loaded, we want to use it.
 * But it should be excluded in other environments (e.g. Cloudflare).
 */
export type MaybeBuffer = typeof globalThis extends { Buffer?: infer B }
  ? B extends new (
      ...a: unknown[]
    ) => unknown
    ? InstanceType<B>
    : ArrayBuffer | Uint8Array
  : ArrayBuffer | Uint8Array
