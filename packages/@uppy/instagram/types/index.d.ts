import { Plugin, PluginOptions, Uppy } from '@uppy/core';
import { ProviderOptions } from '@uppy/companion-client';

declare module Instagram {
  interface InstagramOptions extends PluginOptions, ProviderOptions {
    serverUrl: string;
    serverPattern: string | RegExp | Array<string | RegExp>;
  }
}

declare class Instagram extends Plugin {
  constructor(uppy: Uppy, opts: Partial<Instagram.InstagramOptions>);
}

export = Instagram;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof Instagram, opts: Partial<Instagram.InstagramOptions>): Uppy;
  }
}
