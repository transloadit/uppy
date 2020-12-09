import Uppy = require('@uppy/core')
import ImageEditorLocale = require('./generatedLocale')

declare module ImageEditor {
  type Actions = {
    revert: boolean
    rotate: boolean
    flip: boolean
    zoomIn: boolean
    zoomOut: boolean
    cropSquare: boolean
    cropWidescreen: boolean
    cropWidescreenVertical: boolean
  }

  export interface ImageEditorOptions extends Uppy.PluginOptions {
    cropperOptions?: object
    actions?: Actions
    quality?: number
    target?: Uppy.PluginTarget
    locale?: ImageEditorLocale
  }
}

declare class ImageEditor extends Uppy.Plugin<ImageEditor.ImageEditorOptions> {}

export = ImageEditor
