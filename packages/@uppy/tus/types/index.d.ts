import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module '@uppy/tus' {
  export interface TusOptions extends PluginOptions {
    limit: number;
    endpoint: string;
    uploadUrl: string;
    useFastRemoteRetry: boolean;
    resume: boolean;
    autoRetry: boolean;
  }

  export default class Tus extends Plugin {
    constructor(uppy: Uppy, opts: Partial<TusOptions>);
  }
}
