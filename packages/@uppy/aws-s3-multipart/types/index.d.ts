import Uppy = require('@uppy/core')

type MaybePromise<T> = T | Promise<T>

declare module AwsS3Multipart {
  interface AwsS3Part {
    PartNumber?: number
    Size?: number
    ETag?: string
  }

  interface AwsS3MultipartOptions extends Uppy.PluginOptions {
    companionUrl?: string
    getChunkSize?: (file: Uppy.UppyFile) => number
    createMultipartUpload?: (
      file: Uppy.UppyFile
    ) => MaybePromise<{ uploadId: string; key: string }>
    listParts?: (
      file: Uppy.UppyFile,
      opts: { uploadId: string; key: string }
    ) => MaybePromise<AwsS3Part[]>
    prepareUploadPart?: (
      file: Uppy.UppyFile,
      partData: { uploadId: string; key: string; body: Blob; number: number }
    ) => MaybePromise<{ url: string, headers?: { [k: string]: string } }>
    abortMultipartUpload?: (
      file: Uppy.UppyFile,
      opts: { uploadId: string; key: string }
    ) => MaybePromise<void>
    completeMultipartUpload?: (
      file: Uppy.UppyFile,
      opts: { uploadId: string; key: string; parts: AwsS3Part[] }
    ) => MaybePromise<{ location?: string }>
    timeout?: number
    limit?: number
    retryDelays?: number[] | null
  }
}

declare class AwsS3Multipart extends Uppy.Plugin<
  AwsS3Multipart.AwsS3MultipartOptions
> {}

export = AwsS3Multipart
