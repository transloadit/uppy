import Uppy = require('@uppy/core')

declare module GoldenRetriever {
  interface GoldenRetrieverOptions extends Uppy.PluginOptions {
    expires?: number
    serviceWorker?: boolean
    indexedDB?: any
  }
}

declare class GoldenRetriever extends Uppy.Plugin<
  GoldenRetriever.GoldenRetrieverOptions
> {}

export = GoldenRetriever
