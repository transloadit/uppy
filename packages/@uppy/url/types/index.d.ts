import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module '@uppy/url' {
  export interface UrlOptions extends PluginOptions {
    serverUrl: string;
    // TODO inherit from ProviderOptions
  }

  export default class Url extends Plugin {
    constructor(uppy: Uppy, opts: Partial<UrlOptions>);
  }
}
