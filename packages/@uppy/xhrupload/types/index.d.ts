import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module '@uppy/xhrupload' {
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

  export default class XHRUpload extends Plugin {
    constructor(uppy: Uppy, opts: Partial<XHRUploadOptions>);
  }
}
