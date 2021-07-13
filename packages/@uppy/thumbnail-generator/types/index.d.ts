import type { PluginOptions, UIPlugin } from '@uppy/core'

import ThumbnailGeneratorLocale from './generatedLocale'

interface ThumbnailGeneratorOptions extends PluginOptions {
    thumbnailWidth?: number,
    thumbnailHeight?: number,
    thumbnailType?: string,
    waitForThumbnailsBeforeUpload?: boolean,
    lazy?: boolean,
    locale?: ThumbnailGeneratorLocale,
}

declare class ThumbnailGenerator extends UIPlugin<ThumbnailGeneratorOptions> {}

export default ThumbnailGenerator
