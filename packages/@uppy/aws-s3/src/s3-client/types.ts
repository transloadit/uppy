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
