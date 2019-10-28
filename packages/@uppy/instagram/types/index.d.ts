import Uppy = require('@uppy/core')
import CompanionClient = require('@uppy/companion-client')

declare module Instagram {
  interface InstagramOptions
    extends Uppy.PluginOptions,
      CompanionClient.RequestClientOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    companionUrl: string
    companionAllowedHosts?: string | RegExp | Array<string | RegExp>
  }
}

declare class Instagram extends Uppy.Plugin<Instagram.InstagramOptions> {}

export = Instagram
