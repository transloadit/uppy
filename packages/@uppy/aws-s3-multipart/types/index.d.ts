import type { BasePlugin, UppyFile } from '@uppy/core'

type MaybePromise<T> = T | Promise<T>

export interface AwsS3Part {
  PartNumber?: number
  Size?: number
  ETag?: string
}
export interface AwsS3SignedPart {
  url: string
  headers?: Record<string, string>
}
export interface AwsS3STSResponse {
  credentials: {
    AccessKeyId: string
    SecretAccessKey: string
    SessionToken: string
    Expiration?: string
  }
  bucket: string
  region: string
}

export interface AwsS3MultipartOptions {
    id?: string
    companionHeaders?: { [type: string]: string }
    companionUrl?: string
    companionCookiesRule?: string
    allowedMetaFields?: string[] | null
    getChunkSize?: (file: UppyFile) => number
    createMultipartUpload?: (
      file: UppyFile
    ) => MaybePromise<{ uploadId: string; key: string }>
    listParts?: (
      file: UppyFile,
      opts: { uploadId: string; key: string }
    ) => MaybePromise<AwsS3Part[]>
    signPart?: (
      file: UppyFile,
      opts: { uploadId: string; key: string; partNumber: number; body: Blob; signal: AbortSignal }
    ) => MaybePromise<AwsS3SignedPart>
    abortMultipartUpload?: (
      file: UppyFile,
      opts: { uploadId: string; key: string }
    ) => MaybePromise<void>
    completeMultipartUpload?: (
      file: UppyFile,
      opts: { uploadId: string; key: string; parts: AwsS3Part[] }
    ) => MaybePromise<{ location?: string }>
    limit?: number
    shouldUseMultipart?: boolean | ((file: UppyFile) => boolean)
    retryDelays?: number[] | null
    /** @deprecated this option is currently not used and may be removed in a future version */
    getUploadParameters?: (
      file: UppyFile
    ) => MaybePromise<{ url: string }>
}

declare class AwsS3Multipart extends BasePlugin<
  AwsS3MultipartOptions
> {}

export default AwsS3Multipart
