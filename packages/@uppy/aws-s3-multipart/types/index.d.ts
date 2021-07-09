import type { PluginOptions, BasePlugin, UppyFile } from '@uppy/core'

type MaybePromise<T> = T | Promise<T>

declare module AwsS3Multipart {
  interface AwsS3Part {
    PartNumber?: number
    Size?: number
    ETag?: string
  }

  interface AwsS3MultipartOptions extends PluginOptions {
    companionHeaders?: { [type: string]: string }
    companionUrl?: string
    getChunkSize?: (file: UppyFile) => number
    createMultipartUpload?: (
      file: UppyFile
    ) => MaybePromise<{ uploadId: string; key: string }>
    listParts?: (
      file: UppyFile,
      opts: { uploadId: string; key: string }
    ) => MaybePromise<AwsS3Part[]>
    prepareUploadPart?: (
      file: UppyFile,
      partData: { uploadId: string; key: string; body: Blob; number: number }
    ) => MaybePromise<{ url: string, headers?: { [k: string]: string } }>
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
}

declare class AwsS3Multipart extends BasePlugin<
  AwsS3Multipart.AwsS3MultipartOptions
> {}

export default AwsS3Multipart
