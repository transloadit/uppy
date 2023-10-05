import type { PluginTarget, UIPlugin, UIPluginOptions } from '@uppy/core'
import type {
  PublicProviderOptions,
  TokenStorage,
} from '@uppy/companion-client'

export interface FacebookOptions
  extends UIPluginOptions,
    PublicProviderOptions {
  target?: PluginTarget
  title?: string
  storage?: TokenStorage
}

declare class Facebook extends UIPlugin<FacebookOptions> {}

export default Facebook
