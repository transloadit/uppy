import {
  getAllowedHosts,
  tokenStorage,
  type CompanionPluginOptions,
  SearchProvider,
} from '@uppy/companion-client'
import { UIPlugin, Uppy } from '@uppy/core'
import { SearchProviderViews } from '@uppy/provider-views'
import { h, type ComponentChild } from 'preact'

import type {
  UppyFile,
  Body,
  Meta,
  AsyncStore,
  UnknownSearchProviderPlugin,
  UnknownSearchProviderPluginState,
} from '@uppy/core'
import locale from './locale.js'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../package.json'

export type UnsplashOptions = { utmSource?: string } & CompanionPluginOptions

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
