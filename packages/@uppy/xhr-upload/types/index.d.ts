import type { PluginOptions, BasePlugin, UppyFile } from '@uppy/core'
import XHRUploadLocale from './generatedLocale'

declare module XHRUpload {
  type Headers = {
    [name: string]: string | number
  }
  
  export interface XHRUploadOptions extends PluginOptions {
    limit?: number
    bundle?: boolean
    formData?: boolean
    headers?: Headers | ((file: UppyFile) => Headers)
    metaFields?: string[]
    fieldName?: string
    timeout?: number
    responseUrlFieldName?: string
    endpoint: string
    method?: 'GET' | 'POST' | 'PUT' | 'HEAD' | 'get' | 'post' | 'put' | 'head'
    locale?: XHRUploadLocale
    responseType?: string
    withCredentials?: boolean
  }
}

declare class XHRUpload extends BasePlugin<XHRUpload.XHRUploadOptions> {}

export default XHRUpload
