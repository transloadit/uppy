import { Plugin, PluginOptions, Uppy } from '@uppy/core';

export interface AssemblyOptions {
  params: object;
  fields: object;
  signature: string;
}

export interface TransloaditOptions extends PluginOptions {
  params: any;
  signature: string;
  service: string;
  waitForEncoding: boolean;
  waitForMetadata: boolean;
  importFromUploadURLs: boolean;
  alwaysRunAssembly: boolean;
  getAssemblyOptions: (file: object) => AssemblyOptions | Promise<AssemblyOptions>;
}

export default class Transloadit extends Plugin {
  constructor(uppy: Uppy, opts: Partial<TransloaditOptions>);
}
