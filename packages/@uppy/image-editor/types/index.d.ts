import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'
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

export interface ImageEditorOptions extends PluginOptions {
  cropperOptions?: Record<string, unknown>
  actions?: Actions
  quality?: number
  target?: PluginTarget
  locale?: ImageEditorLocale
}

declare class ImageEditor extends UIPlugin<ImageEditorOptions> {}

export default ImageEditor
