import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'
import type { PublicProviderOptions, TokenStorage } from '@uppy/companion-client'

declare module Facebook {
  interface FacebookOptions extends PluginOptions, PublicProviderOptions {
    replaceTargetContent?: boolean
    target?: PluginTarget
    title?: string
    storage?: TokenStorage
  }
}

declare class Facebook extends UIPlugin<Facebook.FacebookOptions> {}

export default Facebook
