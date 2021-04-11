import Uppy = require('@uppy/core')
import CompanionClient = require('@uppy/companion-client')

declare module Zoom {
  interface ZoomOptions
    extends Uppy.PluginOptions,
      CompanionClient.PublicProviderOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    title?: string
    storage?: CompanionClient.TokenStorage
  }
}

declare class Zoom extends Uppy.Plugin<Zoom.ZoomOptions> {}

export = Zoom
