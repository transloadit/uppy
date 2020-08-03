import Uppy = require('@uppy/core')
import CompanionClient = require('@uppy/companion-client')

declare module Unsplash {
  interface UnsplashOptions
    extends Uppy.PluginOptions,
      CompanionClient.RequestClientOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    title?: string
  }
}

declare class Unsplash extends Uppy.Plugin<Unsplash.UnsplashOptions> {}

export = Unsplash
