import type { PluginOptions, BasePlugin, UppyFile } from '@uppy/core'

type MaybePromise<T> = T | Promise<T>

export interface AwsS3UploadParameters {
    method?: string
    url: string
    fields?: { [type: string]: string }
    headers?: { [type: string]: string }
}

export interface AwsS3Options extends PluginOptions {
    companionUrl?: string
    getUploadParameters?: (file: UppyFile) => MaybePromise<AwsS3UploadParameters>
    allowedMetaFields?: string[] | null
    timeout?: number
    limit?: number
}

declare class AwsS3 extends BasePlugin<AwsS3Options> {}

export default AwsS3
