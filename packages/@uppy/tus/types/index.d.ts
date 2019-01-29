import Uppy = require('@uppy/core');

declare module Tus {
  export interface TusOptions extends Uppy.PluginOptions {
    limit: number;
    endpoint: string;
    uploadUrl: string;
    useFastRemoteRetry: boolean;
    resume: boolean;
    autoRetry: boolean;
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
