import Uppy = require('@uppy/core')

declare module DropTarget {
  interface DropTargetOptions extends Uppy.PluginOptions {
    target: string | Element
  }
}

declare class DropTarget extends Uppy.Plugin<DropTarget.DropTargetOptions> {}

export = DropTarget
