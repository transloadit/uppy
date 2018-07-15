import { Plugin, PluginOptions, Uppy } from '@uppy/core';
import { ProviderOptions } from '@uppy/companion-client';

export interface InstagramOptions extends PluginOptions, ProviderOptions {
  serverUrl: string;
  serverPattern: string | RegExp | Array<string | RegExp>;
}

export default class Instagram extends Plugin {
  constructor(uppy: Uppy, opts: Partial<InstagramOptions>);
}

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof Instagram, opts: Partial<InstagramOptions>): Uppy;
  }
}
