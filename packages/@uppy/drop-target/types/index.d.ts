import Uppy = require('@uppy/core')

declare module DropTarget {
  interface DropTargetOptions extends Uppy.PluginOptions {
    target: Uppy.PluginTarget
  }
}

declare class DropTarget extends Uppy.Plugin<DropTarget.DropTargetOptions> {}

export = DropTarget
