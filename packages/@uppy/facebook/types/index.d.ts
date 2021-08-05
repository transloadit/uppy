import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'
import type { PublicProviderOptions, TokenStorage } from '@uppy/companion-client'

export interface FacebookOptions extends PluginOptions, PublicProviderOptions {
    target?: PluginTarget
    title?: string
    storage?: TokenStorage
}

declare class Facebook extends UIPlugin<FacebookOptions> {}

export default Facebook
