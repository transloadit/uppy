import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'
import type { TokenStorage, PublicProviderOptions } from '@uppy/companion-client'

declare module Zoom {
  interface ZoomOptions extends PluginOptions, PublicProviderOptions {
    replaceTargetContent?: boolean
    target?: PluginTarget
    title?: string
    storage?: TokenStorage
  }
}

declare class Zoom extends UIPlugin<Zoom.ZoomOptions> {}

export default Zoom
