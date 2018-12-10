import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module GoldenRetriever {
  interface GoldenRetrieverOptions extends PluginOptions {
    expires: number;
    serviceWorker: boolean;
    indexedDB: any;
  }
}

declare class GoldenRetriever extends Plugin {
  constructor(uppy: Uppy, opts: Partial<GoldenRetriever.GoldenRetrieverOptions>);
}

export = GoldenRetriever;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof GoldenRetriever, opts: Partial<GoldenRetriever.GoldenRetrieverOptions>): Uppy;
  }
}
