import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'
import type { RequestClientOptions } from '@uppy/companion-client'

declare module Unsplash {
  interface UnsplashOptions extends PluginOptions, RequestClientOptions {
    replaceTargetContent?: boolean
    target?: PluginTarget
    title?: string
  }
}

declare class Unsplash extends UIPlugin<Unsplash.UnsplashOptions> {}

export default Unsplash
