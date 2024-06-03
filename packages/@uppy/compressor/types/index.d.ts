import type { PluginOptions, BasePlugin } from '@uppy/core'
import { UppyFile } from '@uppy/utils'
import type CompressorLocale from './generatedLocale.js'

export interface CompressorOptions extends PluginOptions {
  quality?: number
  limit?: number
  locale?: CompressorLocale
}

export type CompressorCompleteCallback<TMeta> = (
  files: UppyFile<TMeta>[],
) => void

declare module '@uppy/core' {
  export interface UppyEventMap<TMeta> {
    'compressor:complete': CompressorCompleteCallback<TMeta>
  }
}

declare class Compressor extends BasePlugin<CompressorOptions> {}

export default Compressor
