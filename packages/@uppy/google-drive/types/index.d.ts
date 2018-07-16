import { Plugin, PluginOptions, Uppy } from '@uppy/core';
import { ProviderOptions } from '@uppy/server-utils';

export interface GoogleDriveOptions extends PluginOptions, ProviderOptions {
  serverUrl: string;
  serverPattern: string | RegExp | Array<string | RegExp>;
}

export default class GoogleDrive extends Plugin {
  constructor(uppy: Uppy, opts: Partial<GoogleDriveOptions>);
}

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof GoogleDrive, opts: Partial<GoogleDriveOptions>): Uppy;
  }
}
