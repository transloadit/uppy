import Uppy = require('@uppy/core');

declare module XHRUpload {
  export interface XHRUploadOptions extends Uppy.PluginOptions {
    limit?: number;
    bundle?: boolean;
    formData?: FormData;
    headers?: any;
    metaFields?: string[];
    fieldName?: string;
    timeout?: number;
    responseUrlFieldName?: string;
    endpoint: string;
    method?: 'GET' | 'POST' | 'PUT' | 'HEAD';
  }
}

declare class XHRUpload extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: XHRUpload.XHRUploadOptions);
}

export = XHRUpload;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof XHRUpload, opts: XHRUpload.XHRUploadOptions): Uppy.Uppy;
  }
}
