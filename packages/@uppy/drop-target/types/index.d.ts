import type { PluginOptions, BasePlugin } from '@uppy/core'

declare namespace DropTarget {
  interface DropTargetOptions extends PluginOptions {
    target: string | Element
  }
}

declare class DropTarget extends BasePlugin<DropTarget.DropTargetOptions> {}

export default DropTarget
