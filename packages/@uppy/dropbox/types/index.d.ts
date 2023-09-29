import type { PluginTarget, UIPlugin, UIPluginOptions } from '@uppy/core'
import type {
  PublicProviderOptions,
  TokenStorage,
} from '@uppy/companion-client'

export interface DropboxOptions extends UIPluginOptions, PublicProviderOptions {
  target?: PluginTarget
  title?: string
  storage?: TokenStorage
}

declare class Dropbox extends UIPlugin<DropboxOptions> {}

export default Dropbox
