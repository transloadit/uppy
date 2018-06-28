import { Plugin, PluginOptions, Uppy } from '@uppy/core';

export interface DropboxOptions extends PluginOptions {
  serverUrl: string;
}

export default class Dropbox extends Plugin {
  constructor(uppy: Uppy, opts: Partial<DropboxOptions>);
}

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof Dropbox, opts: Partial<DropboxOptions>): Uppy;
  }
}
