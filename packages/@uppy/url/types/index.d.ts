import Uppy = require('@uppy/core')

declare module Url {
  type UrlLocale = Uppy.Locale<
    | 'enterCorrectUrl'
    | 'enterUrlToImport'
    | 'failedToFetch'
    | 'import'
  >

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
