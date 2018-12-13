import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module Tus {
  export interface TusOptions extends PluginOptions {
    limit: number;
    endpoint: string;
    uploadUrl: string;
    useFastRemoteRetry: boolean;
    resume: boolean;
    autoRetry: boolean;
  }
}

declare class Tus extends Plugin {
  constructor(uppy: Uppy, opts: Partial<Tus.TusOptions>);
}

export = Tus;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof Tus, opts: Partial<Tus.TusOptions>): Uppy;
  }
}
