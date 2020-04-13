import Uppy = require('@uppy/core')
import CompanionClient = require('@uppy/companion-client')

declare module OneDrive {
  interface OneDriveOptions
    extends Uppy.PluginOptions,
      CompanionClient.PublicProviderOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    title?: string
    storage?: CompanionClient.TokenStorage
  }
}

declare class OneDrive extends Uppy.Plugin<OneDrive.OneDriveOptions> {}

export = OneDrive
