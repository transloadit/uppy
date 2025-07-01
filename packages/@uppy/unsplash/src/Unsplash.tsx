import {
  type CompanionPluginOptions,
  getAllowedHosts,
  SearchProvider,
  tokenStorage,
} from '@uppy/companion-client'
import type {
  AsyncStore,
  Body,
  Meta,
  UnknownSearchProviderPlugin,
  UnknownSearchProviderPluginState,
  UppyFile,
} from '@uppy/core'
import { UIPlugin, type Uppy } from '@uppy/core'
import { SearchProviderViews } from '@uppy/provider-views'
import type { LocaleStrings } from '@uppy/utils/lib/Translator'
// biome-ignore lint/style/useImportType: h is not a type
import { type ComponentChild, h } from 'preact'
import packageJson from '../package.json' with { type: 'json' }
import locale from './locale.js'

export type UnsplashOptions = {
  utmSource?: string
  locale?: LocaleStrings<typeof locale>
} & CompanionPluginOptions

export default class Unsplash<M extends Meta, B extends Body>
  extends UIPlugin<UnsplashOptions, M, B, UnknownSearchProviderPluginState>
  implements UnknownSearchProviderPlugin<M, B>
{
  static VERSION = packageJson.version

  icon: () => h.JSX.Element

  provider: SearchProvider<M, B>

  view!: SearchProviderViews<M, B>

  storage: AsyncStore

  files: UppyFile<M, B>[]

  hostname: string

  constructor(uppy: Uppy<M, B>, opts: UnsplashOptions) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.files = []
    this.storage = this.opts.storage || tokenStorage
    this.id = this.opts.id || 'Unsplash'

    this.defaultLocale = locale
    this.i18nInit()
    this.title = this.i18n('pluginNameUnsplash')

    this.icon = () => (
      <svg
        className="uppy-DashboardTab-iconUnsplash"
        viewBox="0 0 32 32"
        height="32"
        width="32"
        aria-hidden="true"
      >
        <g fill="currentcolor">
          <path d="M46.575 10.883v-9h12v9zm12 5h10v18h-32v-18h10v9h12z" />
          <path d="M13 12.5V8h6v4.5zm6 2.5h5v9H8v-9h5v4.5h6z" />
        </g>
      </svg>
    )

    if (!this.opts.companionUrl) {
      throw new Error(
        'Companion hostname is required, please consult https://uppy.io/docs/companion',
      )
    }

    this.hostname = this.opts.companionUrl

    this.opts.companionAllowedHosts = getAllowedHosts(
      this.opts.companionAllowedHosts,
      this.opts.companionUrl,
    )
    this.provider = new SearchProvider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      companionCookiesRule: this.opts.companionCookiesRule,
      provider: 'unsplash',
      pluginId: this.id,
    })
  }

  install(): void {
    this.view = new SearchProviderViews(this, {
      provider: this.provider,
      viewType: 'unsplash',
      showFilter: true,
      utmSource: this.opts.utmSource,
    })

    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }

  render(state: unknown): ComponentChild {
    return this.view.render(state)
  }

  uninstall(): void {
    this.unmount()
  }
}
