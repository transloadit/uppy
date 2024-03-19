import type { PluginTarget, UIPlugin, UIPluginOptions } from '@uppy/core'
import type {
  PublicProviderOptions,
  TokenStorage,
} from '@uppy/companion-client'

export interface GooglePhotosOptions
  extends UIPluginOptions,
    PublicProviderOptions {
  target?: PluginTarget
  title?: string
  storage?: TokenStorage
}

declare class GooglePhotos extends UIPlugin<GooglePhotosOptions> {}

export default GooglePhotos
