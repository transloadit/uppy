import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'
import type Cropper from 'cropperjs'
import ImageEditorLocale from './generatedLocale'

type Actions = {
  revert: boolean
  rotate: boolean
  granularRotate: boolean
  flip: boolean
  zoomIn: boolean
  zoomOut: boolean
  cropSquare: boolean
  cropWidescreen: boolean
  cropWidescreenVertical: boolean
}

interface UppyCropperOptions extends Cropper.Options {
  croppedCanvasOptions: Cropper.GetCroppedCanvasOptions
}

export interface ImageEditorOptions extends PluginOptions {
  cropperOptions?: UppyCropperOptions
  actions?: Actions
  quality?: number
  target?: PluginTarget
  locale?: ImageEditorLocale
}

declare class ImageEditor extends UIPlugin<ImageEditorOptions> {}

export default ImageEditor
