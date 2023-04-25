import type { PluginOptions, BasePlugin, UppyFile } from '@uppy/core'

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

export interface AwsS3MultipartOptions extends PluginOptions {
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
      opts: { uploadId: string; key: string; signal: AbortSignal }
    ) => MaybePromise<AwsS3Part[]>
    signPart?: (
      file: UppyFile,
      opts: { uploadId: string; key: string; partNumber: number; body: Blob, signal: AbortSignal }
    ) => MaybePromise<AwsS3SignedPart>
    /** @deprecated Use signPart instead */
    prepareUploadParts?: (
      file: UppyFile,
      partData: { uploadId: string; key: string; parts: [{ number: number, chunk: Blob }], signal: AbortSignal }
    ) => MaybePromise<{ presignedUrls: { [k: number]: string }, headers?: { [k: string]: string } }>
    abortMultipartUpload?: (
      file: UppyFile,
      opts: { uploadId: string; key: string; signal: AbortSignal }
    ) => MaybePromise<void>
    completeMultipartUpload?: (
      file: UppyFile,
      opts: { uploadId: string; key: string; parts: AwsS3Part[]; signal: AbortSignal }
    ) => MaybePromise<{ location?: string }>
    limit?: number
    retryDelays?: number[] | null
}

declare class AwsS3Multipart extends BasePlugin<
  AwsS3MultipartOptions
> {}

export default AwsS3Multipart
