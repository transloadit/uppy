import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'

declare module Informer {
  interface InformerOptions extends PluginOptions {
    replaceTargetContent?: boolean
    target?: PluginTarget
  }
}

declare class Informer extends UIPlugin<Informer.InformerOptions> {}

export default Informer
