import type { RequestClientOptions } from '@uppy/companion-client'
import type { PluginOptions, BasePlugin, UppyFile } from '@uppy/core'

type MaybePromise<T> = T | Promise<T>

export interface AwsS3UploadParameters {
    method?: string
    url: string
    fields?: { [type: string]: string }
    headers?: { [type: string]: string }
}

type Parent = PluginOptions & Partial<RequestClientOptions>
export interface AwsS3Options extends Parent {
    getUploadParameters?: (file: UppyFile) => MaybePromise<AwsS3UploadParameters>
    allowedMetaFields?: string[] | null
    /** @deprecated future versions of this plugin will use the Expires value from the backend */
    timeout?: number
    limit?: number
}

declare class AwsS3 extends BasePlugin<AwsS3Options> {}

export default AwsS3
