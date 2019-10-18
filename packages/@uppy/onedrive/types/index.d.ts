import Uppy = require('@uppy/core');
import CompanionClient = require('@uppy/companion-client');

declare module OneDrive {
  interface OneDriveOptions extends Uppy.PluginOptions, CompanionClient.ProviderOptions {
    companionUrl: string;
    companionAllowedHosts: string | RegExp | Array<string | RegExp>;
  }
}

declare class OneDrive extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: Partial<OneDrive.OneDriveOptions>);
}

export = OneDrive;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof OneDrive, opts: Partial<OneDrive.OneDriveOptions>): Uppy.Uppy;
  }
}
