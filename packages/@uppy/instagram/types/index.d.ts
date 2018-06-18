import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module '@uppy/instagram' {
  export interface InstagramOptions extends PluginOptions {
    serverUrl: string;
    // TODO inherit from ProviderOptions
  }

  export default class Instagram extends Plugin {
    constructor(uppy: Uppy, opts: Partial<InstagramOptions>);
  }
}
