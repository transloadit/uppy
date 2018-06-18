import { Plugin, PluginOptions, Uppy } from '@uppy/core';

export interface GoldenRetrieverOptions extends PluginOptions {
  expires: number;
  serviceWorker: boolean;
  indexedDB: any;
}

export default class GoldenRetriever extends Plugin {
  constructor(uppy: Uppy, opts: Partial<GoldenRetrieverOptions>);
}
