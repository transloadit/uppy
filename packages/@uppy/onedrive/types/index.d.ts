import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'
import type { PublicProviderOptions, TokenStorage } from '@uppy/companion-client'

declare namespace OneDrive {
  interface OneDriveOptions extends PluginOptions, PublicProviderOptions {
    replaceTargetContent?: boolean
    target?: PluginTarget
    title?: string
    storage?: TokenStorage
  }
}

declare class OneDrive extends UIPlugin<OneDrive.OneDriveOptions> {}

export default OneDrive
