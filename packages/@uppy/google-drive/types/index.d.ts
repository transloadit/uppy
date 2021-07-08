import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'
import type { PublicProviderOptions, TokenStorage } from '@uppy/companion-client'

declare module GoogleDrive {
  interface GoogleDriveOptions extends PluginOptions, PublicProviderOptions {
    replaceTargetContent?: boolean
    target?: PluginTarget
    title?: string
    storage?: TokenStorage
  }
}

declare class GoogleDrive extends UIPlugin<GoogleDrive.GoogleDriveOptions> {}

export default GoogleDrive
