import { Plugin, PluginOptions, Uppy } from '@uppy/core';
import { ProviderOptions } from '@uppy/companion-client';

export interface DropboxOptions extends PluginOptions, ProviderOptions {
  serverUrl: string;
  serverPattern: string | RegExp | Array<string | RegExp>;
}

export default class Dropbox extends Plugin {
  constructor(uppy: Uppy, opts: Partial<DropboxOptions>);
}

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof Dropbox, opts: Partial<DropboxOptions>): Uppy;
  }
}
