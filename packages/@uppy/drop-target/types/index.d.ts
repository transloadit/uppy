import type { PluginOptions, BasePlugin } from '@uppy/core'

interface DropTargetOptions extends PluginOptions {
  target: string | Element
  onDragOver?: (event: DragEvent) => void
  onDrop?: (event: DragEvent) => void
  onDragLeave?: (event: DragEvent) => void
}

declare class DropTarget extends BasePlugin<DropTargetOptions> {}

export default DropTarget
