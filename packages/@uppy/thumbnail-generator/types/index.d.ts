import type { PluginOptions, UIPlugin } from '@uppy/core'

import ThumbnailGeneratorLocale from './generatedLocale'

declare module ThumbnailGenerator {
  interface ThumbnailGeneratorOptions extends PluginOptions {
    thumbnailWidth?: number,
    thumbnailHeight?: number,
    thumbnailType?: string, 
    waitForThumbnailsBeforeUpload?: boolean,
    lazy?: boolean,
    locale?: ThumbnailGeneratorLocale,
  }
}

declare class ThumbnailGenerator extends UIPlugin<
  ThumbnailGenerator.ThumbnailGeneratorOptions
> {}

export default ThumbnailGenerator
