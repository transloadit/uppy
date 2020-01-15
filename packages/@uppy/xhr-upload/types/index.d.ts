import Uppy = require('@uppy/core')

declare module XHRUpload {
  export type XHRUploadLocale = Uppy.Locale<
    | 'timedOut'
  >

  export interface XHRUploadOptions extends Uppy.PluginOptions {
    limit?: number
    bundle?: boolean
    formData?: boolean
    headers?: any
    metaFields?: string[]
    fieldName?: string
    timeout?: number
    responseUrlFieldName?: string
    endpoint: string
    method?: 'GET' | 'POST' | 'PUT' | 'HEAD' | 'get' | 'post' | 'put' | 'head'
    locale?: XHRUploadLocale
  }
}

declare class XHRUpload extends Uppy.Plugin<XHRUpload.XHRUploadOptions> {}

export = XHRUpload
