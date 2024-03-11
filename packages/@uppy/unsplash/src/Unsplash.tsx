import {
  getAllowedHosts,
  tokenStorage,
  type CompanionPluginOptions,
  SearchProvider,
} from '@uppy/companion-client'
import { UIPlugin, Uppy } from '@uppy/core'
import { SearchProviderViews } from '@uppy/provider-views'
import { h, type ComponentChild } from 'preact'

import type { UppyFile, Body, Meta } from '@uppy/utils/lib/UppyFile'
import type { UnknownSearchProviderPluginState } from '@uppy/core/lib/Uppy.ts'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../package.json'

export type UnsplashOptions = CompanionPluginOptions

export default class Unsplash<M extends Meta, B extends Body> extends UIPlugin<
  UnsplashOptions,
  M,
  B,
  UnknownSearchProviderPluginState
> {
  static VERSION = packageJson.version

  icon: () => JSX.Element

  provider: SearchProvider<M, B>

  view: SearchProviderViews<M, B>

  storage: typeof tokenStorage

  files: UppyFile<M, B>[]

  hostname: string

  constructor(uppy: Uppy<M, B>, opts: UnsplashOptions) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.files = []
    this.storage = this.opts.storage || tokenStorage
    this.id = this.opts.id || 'Unsplash'
    this.title = this.opts.title || 'Unsplash'

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
    })

    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async onFirstRender(): Promise<void> {
    // do nothing
  }

  render(state: unknown): ComponentChild {
    return this.view.render(state)
  }

  uninstall(): void {
    this.unmount()
  }
}
