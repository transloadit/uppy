import type { PluginOptions, BasePlugin } from '@uppy/core'

interface DropTargetOptions extends PluginOptions {
    target: string | Element
}

declare class DropTarget extends BasePlugin<DropTargetOptions> {}

export default DropTarget
