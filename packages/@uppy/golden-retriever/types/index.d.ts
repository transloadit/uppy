import Uppy = require('@uppy/core');

declare module GoldenRetriever {
  interface GoldenRetrieverOptions extends Uppy.PluginOptions {
    expires: number;
    serviceWorker: boolean;
    indexedDB: any;
  }
}

declare class GoldenRetriever extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: Partial<GoldenRetriever.GoldenRetrieverOptions>);
}

export = GoldenRetriever;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof GoldenRetriever, opts: Partial<GoldenRetriever.GoldenRetrieverOptions>): Uppy.Uppy;
  }
}
