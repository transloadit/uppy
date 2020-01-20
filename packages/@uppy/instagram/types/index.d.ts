import Uppy = require('@uppy/core')
import CompanionClient = require('@uppy/companion-client')

declare module Instagram {
  interface InstagramOptions
    extends Uppy.PluginOptions,
      CompanionClient.PublicProviderOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    title?: string
  }
}

declare class Instagram extends Uppy.Plugin<Instagram.InstagramOptions> {}

export = Instagram
