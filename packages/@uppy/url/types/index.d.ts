import { Plugin, PluginOptions, Uppy } from '@uppy/core';

export interface UrlOptions extends PluginOptions {
  serverUrl: string;
  // TODO inherit from ProviderOptions
}

export default class Url extends Plugin {
  constructor(uppy: Uppy, opts: Partial<UrlOptions>);
}

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof Url, opts: Partial<UrlOptions>): Uppy;
  }
}
