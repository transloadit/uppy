import {
  Provider,
  getAllowedHosts,
  tokenStorage,
  type CompanionPluginOptions,
} from '@uppy/companion-client'
import { UIPlugin, Uppy } from '@uppy/core'
import { ProviderViews } from '@uppy/provider-views'
import { h, type ComponentChild } from 'preact'

import type { UppyFile, Body, Meta } from '@uppy/utils/lib/UppyFile'
import type { UnknownProviderPluginState } from '@uppy/core/lib/Uppy.ts'
import locale from './locale.ts'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../package.json'

export type ZoomOptions = CompanionPluginOptions

export default class Zoom<M extends Meta, B extends Body> extends UIPlugin<
  ZoomOptions,
  M,
  B,
  UnknownProviderPluginState
> {
  static VERSION = packageJson.version

  icon: () => JSX.Element

  provider: Provider<M, B>

  view: ProviderViews<M, B>

  storage: typeof tokenStorage

  files: UppyFile<M, B>[]

  constructor(uppy: Uppy<M, B>, opts: ZoomOptions) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.files = []
    this.storage = this.opts.storage || tokenStorage
    this.id = this.opts.id || 'Zoom'
    this.icon = () => (
      <svg
        aria-hidden="true"
        focusable="false"
        width="32"
        height="32"
        viewBox="0 0 32 32"
      >
        <path
          d="M24.5 11.125l-2.75 2.063c-.473.353-.75.91-.75 1.5v3.124c0 .59.277 1.147.75 1.5l2.75 2.063a.938.938 0 001.5-.75v-8.75a.938.938 0 00-1.5-.75zm-4.75 9.5c0 1.035-.84 1.875-1.875 1.875H9.75A3.75 3.75 0 016 18.75v-6.875C6 10.84 6.84 10 7.875 10H16a3.75 3.75 0 013.75 3.75v6.875z"
          fill="#2E8CFF"
          fill-rule="evenodd"
        />
      </svg>
    )

    this.opts.companionAllowedHosts = getAllowedHosts(
      this.opts.companionAllowedHosts,
      this.opts.companionUrl,
    )
    this.provider = new Provider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      companionKeysParams: this.opts.companionKeysParams,
      companionCookiesRule: this.opts.companionCookiesRule,
      provider: 'zoom',
      pluginId: this.id,
      supportsRefreshToken: false,
    })

    this.defaultLocale = locale

    this.i18nInit()
    this.title = this.i18n('pluginNameZoom')

    this.onFirstRender = this.onFirstRender.bind(this)
    this.render = this.render.bind(this)
  }

  install(): void {
    this.view = new ProviderViews(this, {
      provider: this.provider,
    })

    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall(): void {
    this.view.tearDown()
    this.unmount()
  }

  async onFirstRender(): Promise<void> {
    await Promise.all([
      this.provider.fetchPreAuthToken(),
      this.view.getFolder(),
    ])
  }

  render(state: unknown): ComponentChild {
    return this.view.render(state)
  }
}
