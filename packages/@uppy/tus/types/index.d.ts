import Uppy = require('@uppy/core');

declare module Tus {
  export interface TusOptions extends Uppy.PluginOptions {
    resume: boolean;
    removeFingerprintOnSuccess: boolean;
    endpoint: string;
    headers: object;
    chunkSize: number;
    withCredentials: booleans;
    overridePatchMethod: boolean;
    retryDelays: number[];
    metaFields: string[] | null;
    autoRetry: boolean;
    limit: number;
  }
}

declare class Tus extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: Partial<Tus.TusOptions>);
}

export = Tus;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof Tus, opts: Partial<Tus.TusOptions>): Uppy.Uppy;
  }
}
