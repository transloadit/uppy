import type { PluginOptions, BasePlugin } from '@uppy/core'
import type CompressorLocale from './generatedLocale'

export interface CompressorOptions extends PluginOptions {
  quality?: number
  limit?: number
  locale?: CompressorLocale
}

export type GenericEventCallback = () => void;

export interface UppyEventMap {
  'compressor:complete': GenericEventCallback
}

declare class Compressor extends BasePlugin<CompressorOptions> {}

export default Compressor
