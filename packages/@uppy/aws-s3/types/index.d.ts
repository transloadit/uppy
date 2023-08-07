import type { BasePlugin, Locale, PluginOptions, UppyFile } from '@uppy/core'

type MaybePromise<T> = T | Promise<T>

export interface AwsS3UploadParameters {
    method?: string
    url: string
    fields?: { [type: string]: string }
    headers?: { [type: string]: string }
}

export interface AwsS3Options extends PluginOptions {
    companionUrl?: string | null
    companionHeaders?: Record<string, string>
    allowedMetaFields?: Array<string> | null
    getUploadParameters?: (file: UppyFile) => MaybePromise<{
      method?: 'POST'
      url: string
      fields?: Record<string, string>
      headers?: Record<string, string>
    } | {
      method: 'PUT'
      url: string
      fields: never
      headers?: Record<string, string>
    }>
    limit?: number
    /** @deprecated this option will not be supported in future versions of this plugin */
    getResponseData?: (responseText: string, response: XMLHttpRequest) => void
    locale?: Locale,
    timeout?: number
}

declare class AwsS3 extends BasePlugin<AwsS3Options> {}

export default AwsS3
