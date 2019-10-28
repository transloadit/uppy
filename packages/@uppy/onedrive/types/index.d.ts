import Uppy = require('@uppy/core')
import CompanionClient = require('@uppy/companion-client')

declare module OneDrive {
  interface OneDriveOptions
    extends Uppy.PluginOptions,
      CompanionClient.ProviderOptions {
    companionUrl: string
    companionAllowedHosts?: string | RegExp | Array<string | RegExp>
  }
}

declare class OneDrive extends Uppy.Plugin<OneDrive.OneDriveOptions> {}

export = OneDrive
