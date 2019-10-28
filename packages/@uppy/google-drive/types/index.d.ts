import Uppy = require('@uppy/core')
import CompanionClient = require('@uppy/companion-client')

declare module GoogleDrive {
  interface GoogleDriveOptions
    extends Uppy.PluginOptions,
      CompanionClient.RequestClientOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    companionUrl: string
    companionAllowedHosts?: string | RegExp | Array<string | RegExp>
  }
}

declare class GoogleDrive extends Uppy.Plugin<GoogleDrive.GoogleDriveOptions> {}

export = GoogleDrive
