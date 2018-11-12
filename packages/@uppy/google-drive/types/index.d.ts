import { Plugin, PluginOptions, Uppy } from '@uppy/core';
import { ProviderOptions } from '@uppy/companion-client';

declare module GoogleDrive {
  interface GoogleDriveOptions extends PluginOptions, ProviderOptions {
    serverUrl: string;
    serverPattern: string | RegExp | Array<string | RegExp>;
  }
}

declare class GoogleDrive extends Plugin {
  constructor(uppy: Uppy, opts: Partial<GoogleDrive.GoogleDriveOptions>);
}

export = GoogleDrive;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof GoogleDrive, opts: Partial<GoogleDrive.GoogleDriveOptions>): Uppy;
  }
}
