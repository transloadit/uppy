import Uppy = require('@uppy/core')
import CompanionClient = require('@uppy/companion-client')

declare module GoogleDrive {
  interface GoogleDriveOptions
    extends Uppy.PluginOptions,
      CompanionClient.PublicProviderOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    title?: string
  }
}

declare class GoogleDrive extends Uppy.Plugin<GoogleDrive.GoogleDriveOptions> {}

export = GoogleDrive
