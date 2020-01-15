import Uppy = require('@uppy/core')
import UrlLocale = require('./generatedLocale')

declare module Url {
  export interface UrlOptions extends Uppy.PluginOptions {
    replaceTargetContent?: boolean
    target?: Uppy.PluginTarget
    companionUrl: string
    locale?: UrlLocale
    // TODO inherit from ProviderOptions
  }
}

declare class Url extends Uppy.Plugin<Url.UrlOptions> {}

export = Url
