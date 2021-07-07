import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'
import type { RequestClientOptions } from '@uppy/companion-client'
import UrlLocale from './generatedLocale'

declare module Url {
  export interface UrlOptions extends PluginOptions, RequestClientOptions {
    replaceTargetContent?: boolean
    target?: PluginTarget
    title?: string
    locale?: UrlLocale
  }
}

declare class Url extends UIPlugin<Url.UrlOptions> {}

export default Url
