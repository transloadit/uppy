import Uppy = require('@uppy/core');
import CompanionClient = require('@uppy/companion-client');

declare module GoogleDrive {
  interface GoogleDriveOptions extends Uppy.PluginOptions, CompanionClient.ProviderOptions {
    serverUrl: string;
    serverPattern: string | RegExp | Array<string | RegExp>;
  }
}

declare class GoogleDrive extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: Partial<GoogleDrive.GoogleDriveOptions>);
}

export = GoogleDrive;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof GoogleDrive, opts: Partial<GoogleDrive.GoogleDriveOptions>): Uppy.Uppy;
  }
}
