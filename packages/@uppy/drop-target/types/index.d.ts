import type { PluginOptions, BasePlugin } from '@uppy/core'

interface DropTargetOptions extends PluginOptions {
    target: string | Element
    activeClass?: string
    setMeta?: (file: File, event: DragEvent) => Record<string, unknown>
  }
}

declare class DropTarget extends BasePlugin<DropTargetOptions> {}

export default DropTarget
