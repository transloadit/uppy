import type { PluginOptions, PluginTarget, UIPlugin } from '@uppy/core'
import type { PublicProviderOptions, TokenStorage } from '@uppy/companion-client'

interface BoxOptions extends PluginOptions, PublicProviderOptions {
    replaceTargetContent?: boolean
    target?: PluginTarget
    title?: string
    storage?: TokenStorage
}

declare class Box extends UIPlugin<BoxOptions> {}

export default Box
