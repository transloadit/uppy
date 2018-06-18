import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module '@uppy/google-drive' {
  export interface GoogleDriveOptions extends PluginOptions {
    serverUrl: string;
    // TODO inherit from ProviderOptions
  }

  export default class GoogleDrive extends Plugin {
    constructor(uppy: Uppy, opts: Partial<GoogleDriveOptions>);
  }
}
