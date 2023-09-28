import type { RequestClientOptions } from '@uppy/companion-client'
import type {
  IndexedObject,
  PluginTarget,
  UIPlugin,
  UIPluginOptions,
} from '@uppy/core'
import UrlLocale from './generatedLocale'

export interface UrlOptions extends UIPluginOptions, RequestClientOptions {
  target?: PluginTarget
  title?: string
  locale?: UrlLocale
}

declare class Url extends UIPlugin<UrlOptions> {
  public addFile(
    url: string,
    meta?: IndexedObject<any>,
  ): undefined | string | never
}

export default Url
