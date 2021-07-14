import Uppy = require('@uppy/core')

declare module DropTarget {
  interface DropTargetOptions extends Uppy.PluginOptions {
    target: string | Element
    activeClass?: string
    setMeta: (file: File, event: DragEvent) => Object
  }
}

declare class DropTarget extends Uppy.Plugin<DropTarget.DropTargetOptions> {}

export = DropTarget
