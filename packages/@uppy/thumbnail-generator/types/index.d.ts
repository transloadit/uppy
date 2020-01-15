import Uppy = require('@uppy/core')

declare module ThumbnailGenerator {
  type ThumbnailGeneratorLocale = Uppy.Locale<
    'generatingThumbnails'
  >

  interface ThumbnailGeneratorOptions extends Uppy.PluginOptions {
    thumbnailWidth?: number
    locale?: ThumbnailGeneratorLocale
  }
}

declare class ThumbnailGenerator extends Uppy.Plugin<
  ThumbnailGenerator.ThumbnailGeneratorOptions
> {}

export = ThumbnailGenerator
