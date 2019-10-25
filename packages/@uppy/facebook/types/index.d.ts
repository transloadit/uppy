import Uppy = require('@uppy/core');
import CompanionClient = require('@uppy/companion-client');

declare module Facebook {
  interface FacebookOptions extends Uppy.PluginOptions, CompanionClient.ProviderOptions {
    companionUrl: string;
    companionAllowedHosts?: string | RegExp | Array<string | RegExp>;
  }
}

declare class Facebook extends Uppy.Plugin<Facebook.FacebookOptions> {}

export = Facebook;
