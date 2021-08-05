import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'
import type { RequestClientOptions } from '@uppy/companion-client'

interface UnsplashOptions extends PluginOptions, RequestClientOptions {
    target?: PluginTarget
    title?: string
}

declare class Unsplash extends UIPlugin<UnsplashOptions> {}

export default Unsplash
