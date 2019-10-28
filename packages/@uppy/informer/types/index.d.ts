import Uppy = require('@uppy/core')

declare module Informer {
  interface Color {
    bg: string | number
    text: string | number
  }

  interface InformerOptions extends Uppy.PluginOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    typeColors?: { [type: string]: Color }
  }
}

declare class Informer extends Uppy.Plugin<Informer.InformerOptions> {}

export = Informer
