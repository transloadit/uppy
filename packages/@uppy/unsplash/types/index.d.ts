import type { RequestClientOptions } from '@uppy/companion-client'
import type { PluginTarget, UIPlugin, UIPluginOptions } from '@uppy/core'

interface UnsplashOptions extends UIPluginOptions, RequestClientOptions {
  target?: PluginTarget
  title?: string
}

declare class Unsplash extends UIPlugin<UnsplashOptions> {}

export default Unsplash
