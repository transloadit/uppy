import Uppy = require('@uppy/core');
import CompanionClient = require('@uppy/companion-client');

declare module Dropbox {
  interface DropboxOptions extends Uppy.PluginOptions, CompanionClient.ProviderOptions {
    serverUrl: string;
    serverPattern: string | RegExp | Array<string | RegExp>;
  }
}

declare class Dropbox extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: Partial<Dropbox.DropboxOptions>);
}

export = Dropbox;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof Dropbox, opts: Partial<Dropbox.DropboxOptions>): Uppy.Uppy;
  }
}
