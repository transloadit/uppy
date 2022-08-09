import type { PluginOptions, UIPlugin, PluginTarget, IndexedObject } from '@uppy/core'
import type { RequestClientOptions } from '@uppy/companion-client'
import UrlLocale from './generatedLocale'

export interface UrlOptions extends PluginOptions, RequestClientOptions {
    target?: PluginTarget
    title?: string
    locale?: UrlLocale
}

declare class Url extends UIPlugin<UrlOptions> {
  public addFile(url: string, meta?: IndexedObject<any>): undefined | string | never
}

export default Url
