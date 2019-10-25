import Uppy = require('@uppy/core');

declare module Url {
  export interface UrlOptions extends Uppy.PluginOptions {
    companionUrl: string;
    // TODO inherit from ProviderOptions
  }
}

declare class Url extends Uppy.Plugin<Url.UrlOptions> {}

export = Url;
