import Uppy = require('@uppy/core')
import ImageEditorLocale = require('./generatedLocale')

declare module ImageEditor {
  export interface ImageEditorOptions extends Uppy.PluginOptions {
    cropperOptions?: object
    quality?: number,
    target?: Uppy.PluginTarget
    locale?: ImageEditorLocale
  }
}

declare class ImageEditor extends Uppy.Plugin<ImageEditor.ImageEditorOptions> {}

export = ImageEditor
