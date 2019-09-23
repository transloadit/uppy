import Uppy = require('@uppy/core');
import CompanionClient = require('@uppy/companion-client');

declare module Facebook {
  interface FacebookOptions extends Uppy.PluginOptions, CompanionClient.ProviderOptions {
    companionUrl: string;
    companionAllowedHosts: string | RegExp | Array<string | RegExp>;
  }
}

declare class Facebook extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: Partial<Facebook.FacebookOptions>);
}

export = Facebook;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof Facebook, opts: Partial<Facebook.FacebookOptions>): Uppy.Uppy;
  }
}
