import type { BasePlugin, UppyFile } from "@uppy/core"

type MaybePromise<T> = T | Promise<T>

export interface AwsS3UploadParameters {
    method?: string
    url: string
    fields?: { [type: string]: string }
    headers?: { [type: string]: string }
}

export interface AwsS3Options {
    id?: string
    companionUrl?: string | null
    companionHeaders?: Record<string, string>
    allowedMetaFields?: Array<string> | null
    getUploadParameters?: (file: UppyFile) => MaybePromise<{
      method: "PUT" | "POST"
      url: string
      fields: Record<string, string> | null
      headers: Record<string, string>
    }>
    limit?: number
    getResponseData?: (responseText: string, response: XMLHttpRequest) => void
    locale?: { strings: Record<string, string> }
    timeout?: number
}

declare class AwsS3 extends BasePlugin<AwsS3Options> {}

export default AwsS3
