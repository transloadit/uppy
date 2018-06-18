import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module '@uppy/dropbox' {
  export interface DropboxOptions extends PluginOptions {
    serverUrl: string;
  }

  export default class Dropbox extends Plugin {
    constructor(uppy: Uppy, opts: Partial<DropboxOptions>);
  }
}
