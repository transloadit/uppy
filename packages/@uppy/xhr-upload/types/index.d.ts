import type { PluginOptions, BasePlugin, UppyFile } from '@uppy/core'
import XHRUploadLocale from './generatedLocale'

export type Headers = {
  [name: string]: string | number
}

export interface XHRUploadOptions extends PluginOptions {
  limit?: number
  bundle?: boolean
  formData?: boolean
  headers?: Headers | ((file: UppyFile) => Headers)
  allowedMetaFields?: string[] | null
  fieldName?: string
  timeout?: number
  responseUrlFieldName?: string
  endpoint: string
  method?: 'GET' | 'POST' | 'PUT' | 'HEAD' | 'PATCH' | 'get' | 'post' | 'put' | 'head' | 'patch'
  locale?: XHRUploadLocale
  responseType?: string
  withCredentials?: boolean
  validateStatus?: (
    statusCode: number,
    responseText: string,
    response: unknown,
  ) => boolean
  getResponseData?: (responseText: string, response: unknown) => any
  getResponseError?: (responseText: string, xhr: unknown) => Error
}

declare class XHRUpload extends BasePlugin<XHRUploadOptions> {}

export default XHRUpload
