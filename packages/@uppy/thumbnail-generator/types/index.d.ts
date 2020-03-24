import Uppy = require('@uppy/core')
import ThumbnailGeneratorLocale = require('./generatedLocale')

declare module ThumbnailGenerator {
  interface ThumbnailGeneratorOptions extends Uppy.PluginOptions {
    thumbnailWidth?: number
    locale?: ThumbnailGeneratorLocale
  }
}

declare class ThumbnailGenerator extends Uppy.Plugin<
  ThumbnailGenerator.ThumbnailGeneratorOptions
> {}

export = ThumbnailGenerator
