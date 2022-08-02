import type { PluginOptions, BasePlugin, UppyFile } from '@uppy/core'

type MaybePromise<T> = T | Promise<T>

export interface AwsS3Part {
  PartNumber?: number
  Size?: number
  ETag?: string
}

export interface AwsS3MultipartOptions extends PluginOptions {
    companionHeaders?: { [type: string]: string }
    companionUrl?: string
    companionCookiesRule?: string
    getChunkSize?: (file: UppyFile) => number
    createMultipartUpload?: (
      file: UppyFile
    ) => MaybePromise<{ uploadId: string; key: string }>
    listParts?: (
      file: UppyFile,
      opts: { uploadId: string; key: string }
    ) => MaybePromise<AwsS3Part[]>
    prepareUploadParts?: (
      file: UppyFile,
      partData: { uploadId: string; key: string; parts: Array<{ number: number, chunk: Blob }> }
    ) => MaybePromise<{ presignedUrls: { [k: number]: string }, headers?: { [k: string]: string } }>
    abortMultipartUpload?: (
      file: UppyFile,
      opts: { uploadId: string; key: string }
    ) => MaybePromise<void>
    completeMultipartUpload?: (
      file: UppyFile,
      opts: { uploadId: string; key: string; parts: AwsS3Part[] }
    ) => MaybePromise<{ location?: string }>
    timeout?: number
    limit?: number
    retryDelays?: number[] | null
}

declare class AwsS3Multipart extends BasePlugin<
  AwsS3MultipartOptions
> {}

export default AwsS3Multipart
