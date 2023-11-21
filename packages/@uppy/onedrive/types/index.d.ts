import type { PluginTarget, UIPlugin, UIPluginOptions } from '@uppy/core'
import type {
  PublicProviderOptions,
  TokenStorage,
} from '@uppy/companion-client'

export interface OneDriveOptions
  extends UIPluginOptions,
    PublicProviderOptions {
  target?: PluginTarget
  title?: string
  storage?: TokenStorage
}

declare class OneDrive extends UIPlugin<OneDriveOptions> {}

export default OneDrive
