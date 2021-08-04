import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'

interface InformerOptions extends PluginOptions {
  replaceTargetContent?: boolean
  target?: PluginTarget
}

declare class Informer extends UIPlugin<InformerOptions> {}

export default Informer
