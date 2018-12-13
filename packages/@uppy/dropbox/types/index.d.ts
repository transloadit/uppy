import { Plugin, PluginOptions, Uppy } from '@uppy/core';
import { ProviderOptions } from '@uppy/companion-client';

declare module Dropbox {
  interface DropboxOptions extends PluginOptions, ProviderOptions {
    serverUrl: string;
    serverPattern: string | RegExp | Array<string | RegExp>;
  }
}

declare class Dropbox extends Plugin {
  constructor(uppy: Uppy, opts: Partial<Dropbox.DropboxOptions>);
}

export = Dropbox;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof Dropbox, opts: Partial<Dropbox.DropboxOptions>): Uppy;
  }
}
