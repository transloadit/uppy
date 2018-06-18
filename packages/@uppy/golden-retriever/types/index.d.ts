import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module '@uppy/golden-retriever' {
  export interface GoldenRetrieverOptions extends PluginOptions {
    expires: number;
    serviceWorker: boolean;
    indexedDB: any;
  }

  export default class GoldenRetriever extends Plugin {
    constructor(uppy: Uppy, opts: Partial<GoldenRetrieverOptions>);
  }
}
