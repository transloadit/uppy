import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module XHRUpload {
  export interface XHRUploadOptions extends PluginOptions {
    limit: string;
    bundle: boolean;
    formData: FormData;
    headers: any;
    metaFields: string[];
    fieldName: string;
    timeout: number;
    responseUrlFieldName: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'HEAD';
  }
}

declare class XHRUpload extends Plugin {
  constructor(uppy: Uppy, opts: Partial<XHRUpload.XHRUploadOptions>);
}

export = XHRUpload;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof XHRUpload, opts: Partial<XHRUpload.XHRUploadOptions>): Uppy;
  }
}
