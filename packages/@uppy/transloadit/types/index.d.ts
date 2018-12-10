import { Plugin, PluginOptions, Uppy, UppyFile } from '@uppy/core';

declare module Transloadit {
  interface AssemblyParameters {
    auth: { key: string };
    template_id?: string;
    steps?: { [step: string]: object };
    notify_url?: string;
    fields?: { [name: string]: number | string };
  }

  interface AssemblyOptions {
    params: AssemblyParameters;
    fields?: { [name: string]: number | string };
    signature?: string;
  }

  interface TransloaditOptions extends PluginOptions {
    params: AssemblyParameters;
    signature: string;
    service: string;
    waitForEncoding: boolean;
    waitForMetadata: boolean;
    importFromUploadURLs: boolean;
    alwaysRunAssembly: boolean;
    getAssemblyOptions: (file: UppyFile) => AssemblyOptions | Promise<AssemblyOptions>;
  }
}

declare class Transloadit extends Plugin {
  constructor(uppy: Uppy, opts: Partial<Transloadit.TransloaditOptions>);
}

export = Transloadit;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof Transloadit, opts: Partial<Transloadit.TransloaditOptions>): Uppy;
  }
}
