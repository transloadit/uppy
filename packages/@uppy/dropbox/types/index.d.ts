import Uppy = require('@uppy/core')
import CompanionClient = require('@uppy/companion-client')

declare module Dropbox {
  interface DropboxOptions
    extends Uppy.PluginOptions,
      CompanionClient.RequestClientOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    companionUrl: string
    companionAllowedHosts?: string | RegExp | Array<string | RegExp>
  }
}

declare class Dropbox extends Uppy.Plugin<Dropbox.DropboxOptions> {}

export = Dropbox
