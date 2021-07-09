import type { PluginOptions, PluginTarget, UIPlugin } from '@uppy/core'
import type { PublicProviderOptions, TokenStorage } from '@uppy/companion-client'

declare module Box {
  interface BoxOptions extends PluginOptions, PublicProviderOptions {
    replaceTargetContent?: boolean
    target?: PluginTarget
    title?: string
    storage?: TokenStorage
  }
}

declare class Box extends UIPlugin<Box.BoxOptions> {}

export default Box
