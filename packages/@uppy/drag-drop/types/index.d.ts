import Uppy = require('@uppy/core')
import DragDropLocale = require('./generatedLocale')

declare module DragDrop {
  interface DragDropOptions extends Uppy.PluginOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    inputName?: string
    allowMultipleFiles?: boolean
    width?: string | number
    height?: string | number
    note?: string
    locale?: DragDropLocale
  }
}

declare class DragDrop extends Uppy.Plugin<DragDrop.DragDropOptions> {}

export = DragDrop
