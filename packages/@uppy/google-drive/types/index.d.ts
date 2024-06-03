import type { PluginTarget, UIPlugin, UIPluginOptions } from '@uppy/core'
import type {
  PublicProviderOptions,
  TokenStorage,
} from '@uppy/companion-client'

export interface GoogleDriveOptions
  extends UIPluginOptions,
    PublicProviderOptions {
  target?: PluginTarget
  title?: string
  storage?: TokenStorage
}

declare class GoogleDrive extends UIPlugin<GoogleDriveOptions> {}

export default GoogleDrive
