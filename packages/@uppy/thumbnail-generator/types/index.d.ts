import type { PluginOptions, UIPlugin, UppyFile } from '@uppy/core'

import ThumbnailGeneratorLocale from './generatedLocale'

interface ThumbnailGeneratorOptions extends PluginOptions {
    thumbnailWidth?: number,
    thumbnailHeight?: number,
    thumbnailType?: string,
    waitForThumbnailsBeforeUpload?: boolean,
    lazy?: boolean,
    locale?: ThumbnailGeneratorLocale,
}

declare class ThumbnailGenerator extends UIPlugin<ThumbnailGeneratorOptions> { }

export default ThumbnailGenerator

// Events

export type ThumbnailGeneratedCallback<TMeta> = (file: UppyFile<TMeta>, preview: string) => void;

declare module '@uppy/core' {
    export interface UppyEventMap<TMeta> {
        'thumbnail:generated' : ThumbnailGeneratedCallback<TMeta>
    }
}
