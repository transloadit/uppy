import Uppy = require('@uppy/core')
import CompanionClient = require('@uppy/companion-client')

declare module Box {
  interface BoxOptions
    extends Uppy.PluginOptions,
      CompanionClient.PublicProviderOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    title?: string
    storage?: CompanionClient.TokenStorage
  }
}

declare class Box extends Uppy.Plugin<Box.BoxOptions> {}

export = Box
