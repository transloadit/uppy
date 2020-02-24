import Uppy = require('@uppy/core')

declare module Informer {
  interface InformerOptions extends Uppy.PluginOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
  }
}

declare class Informer extends Uppy.Plugin<Informer.InformerOptions> {}

export = Informer
