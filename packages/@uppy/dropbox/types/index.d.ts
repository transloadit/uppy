import Uppy = require('@uppy/core')
import CompanionClient = require('@uppy/companion-client')

declare module Dropbox {
  interface DropboxOptions
    extends Uppy.PluginOptions,
      CompanionClient.PublicProviderOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    title?: string
    storage?: CompanionClient.TokenStorage
  }
}

declare class Dropbox extends Uppy.Plugin<Dropbox.DropboxOptions> {}

export = Dropbox
