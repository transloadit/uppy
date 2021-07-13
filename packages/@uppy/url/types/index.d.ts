import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'
import type { RequestClientOptions } from '@uppy/companion-client'
import UrlLocale from './generatedLocale'

export interface UrlOptions extends PluginOptions, RequestClientOptions {
    replaceTargetContent?: boolean
    target?: PluginTarget
    title?: string
    locale?: UrlLocale
}

declare class Url extends UIPlugin<UrlOptions> {}

export default Url
