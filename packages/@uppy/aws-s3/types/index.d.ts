import type { PluginOptions, BasePlugin, UppyFile } from '@uppy/core'

type MaybePromise<T> = T | Promise<T>

interface AwsS3UploadParameters {
    method?: string
    url: string
    fields?: { [type: string]: string }
    headers?: { [type: string]: string }
}

interface AwsS3Options extends PluginOptions {
    companionUrl?: string
    getUploadParameters?: (file: UppyFile) => MaybePromise<AwsS3UploadParameters>
    metaFields?: string[]
    timeout?: number
    limit?: number
}

declare class AwsS3 extends BasePlugin<AwsS3Options> {}

export default AwsS3
