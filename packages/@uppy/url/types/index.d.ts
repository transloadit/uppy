import Uppy = require('@uppy/core');

declare module Url {
  export interface UrlOptions extends Uppy.PluginOptions {
    serverUrl: string;
    // TODO inherit from ProviderOptions
  }
}

declare class Url extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: Partial<Url.UrlOptions>);
}

export = Url;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof Url, opts: Partial<Url.UrlOptions>): Uppy.Uppy;
  }
}
