import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module Url {
  export interface UrlOptions extends PluginOptions {
    serverUrl: string;
    // TODO inherit from ProviderOptions
  }
}

declare class Url extends Plugin {
  constructor(uppy: Uppy, opts: Partial<Url.UrlOptions>);
}

export = Url;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof Url, opts: Partial<Url.UrlOptions>): Uppy;
  }
}
