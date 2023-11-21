import { AwsS3MultipartOptions } from '@uppy/aws-s3-multipart'
import type { BasePlugin, Locale, PluginOptions, UppyFile } from '@uppy/core'

type MaybePromise<T> = T | Promise<T>

export type AwsS3UploadParameters =
  | {
      method?: 'POST'
      url: string
      fields?: Record<string, string>
      expires?: number
      headers?: Record<string, string>
    }
  | {
      method: 'PUT'
      url: string
      fields?: Record<string, never>
      expires?: number
      headers?: Record<string, string>
    }

interface LegacyAwsS3Options extends PluginOptions {
  shouldUseMultipart?: never
  companionUrl?: string | null
  companionHeaders?: Record<string, string>
  allowedMetaFields?: Array<string> | null
  getUploadParameters?: (file: UppyFile) => MaybePromise<AwsS3UploadParameters>
  limit?: number
  /** @deprecated this option will not be supported in future versions of this plugin */
  getResponseData?: (responseText: string, response: XMLHttpRequest) => void
  locale?: Locale
  timeout?: number
}

export type AwsS3Options = LegacyAwsS3Options | AwsS3MultipartOptions

declare class AwsS3 extends BasePlugin<AwsS3Options> {}

export default AwsS3
