import Uppy = require('@uppy/core')

declare module DragDrop {
  type DragDropLocale = Uppy.Locale<
    | 'dropHereOr'
    | 'browse'
  >

  interface DragDropOptions extends Uppy.PluginOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    inputName?: string
    allowMultipleFiles?: boolean
    width?: string
    height?: string
    note?: string
    locale?: DragDropLocale
  }
}

declare class DragDrop extends Uppy.Plugin<DragDrop.DragDropOptions> {}

export = DragDrop
