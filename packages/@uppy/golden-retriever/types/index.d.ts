import type { PluginOptions, BasePlugin } from '@uppy/core'

declare namespace GoldenRetriever {
  interface GoldenRetrieverOptions extends PluginOptions {
    expires?: number
    serviceWorker?: boolean
    indexedDB?: any
  }
}

declare class GoldenRetriever extends BasePlugin<
  GoldenRetriever.GoldenRetrieverOptions
> {}

export default GoldenRetriever
