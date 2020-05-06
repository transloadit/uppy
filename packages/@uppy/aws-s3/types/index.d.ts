import Uppy = require('@uppy/core')

type MaybePromise<T> = T | Promise<T>

declare module AwsS3 {
  interface AwsS3UploadParameters {
    method?: string
    url: string
    fields?: { [type: string]: string }
    headers?: { [type: string]: string }
  }

  interface AwsS3Options extends Uppy.PluginOptions {
    companionUrl?: string
    getUploadParameters?: (
      file: Uppy.UppyFile
    ) => MaybePromise<AwsS3UploadParameters>
    metaFields?: string[]
    timeout?: number
    limit?: number
  }
}

declare class AwsS3 extends Uppy.Plugin<AwsS3.AwsS3Options> {}

export = AwsS3
