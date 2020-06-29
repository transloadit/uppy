import Uppy = require('@uppy/core')
import CompanionClient = require('@uppy/companion-client')
import UrlLocale = require('./generatedLocale')

declare module Url {
  export interface UrlOptions
    extends Uppy.PluginOptions,
      CompanionClient.RequestClientOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    title?: string
    locale?: UrlLocale
  }
}

declare class Url extends Uppy.Plugin<Url.UrlOptions> {}

export = Url
