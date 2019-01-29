import Uppy = require('@uppy/core');
import CompanionClient = require('@uppy/companion-client');

declare module Instagram {
  interface InstagramOptions extends Uppy.PluginOptions, CompanionClient.ProviderOptions {
    serverUrl: string;
    serverPattern: string | RegExp | Array<string | RegExp>;
  }
}

declare class Instagram extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: Partial<Instagram.InstagramOptions>);
}

export = Instagram;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof Instagram, opts: Partial<Instagram.InstagramOptions>): Uppy.Uppy;
  }
}
