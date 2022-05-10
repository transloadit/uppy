import type { PluginOptions, BasePlugin } from '@uppy/core'
import type CompressorLocale from './generatedLocale'

export interface CompressorOptions extends PluginOptions {
  quality?: number
  limit?: number
  locale?: CompressorLocale
}

declare module '@uppy/core' {
  export interface UppyEventMap {
    'compressor:complete': () => void
  }
}

declare class Compressor extends BasePlugin<CompressorOptions> {}

export default Compressor
