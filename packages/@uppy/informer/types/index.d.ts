import type { PluginTarget, UIPlugin, UIPluginOptions } from '@uppy/core'

interface InformerOptions extends UIPluginOptions {
  target?: PluginTarget
}

declare class Informer extends UIPlugin<InformerOptions> {}

export default Informer
