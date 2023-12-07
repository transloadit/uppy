import type { PluginTarget, UIPlugin, UIPluginOptions } from '@uppy/core'
import type {
  TokenStorage,
  PublicProviderOptions,
} from '@uppy/companion-client'

interface ZoomOptions extends UIPluginOptions, PublicProviderOptions {
  target?: PluginTarget
  title?: string
  storage?: TokenStorage
}

declare class Zoom extends UIPlugin<ZoomOptions> {}

export default Zoom
