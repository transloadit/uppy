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

export type BoxOptions = CompanionPluginOptions

export default class Box<M extends Meta, B extends Body> extends UIPlugin<
  BoxOptions,
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

  constructor(uppy: Uppy<M, B>, opts: BoxOptions) {
    super(uppy, opts)
    this.id = this.opts.id || 'Box'
    this.type = 'acquirer'
    this.storage = this.opts.storage || tokenStorage
    this.files = []
    this.icon = () => (
      <svg
        className="uppy-DashboardTab-iconBox"
        aria-hidden="true"
        focusable="false"
        width="32"
        height="32"
        viewBox="0 0 32 32"
      >
        <g fill="currentcolor" fillRule="nonzero">
          <path d="m16.4 13.5c-1.6 0-3 0.9-3.7 2.2-0.7-1.3-2.1-2.2-3.7-2.2-1 0-1.8 0.3-2.5 0.8v-3.6c-0.1-0.3-0.5-0.7-1-0.7s-0.8 0.4-0.8 0.8v7c0 2.3 1.9 4.2 4.2 4.2 1.6 0 3-0.9 3.7-2.2 0.7 1.3 2.1 2.2 3.7 2.2 2.3 0 4.2-1.9 4.2-4.2 0.1-2.4-1.8-4.3-4.1-4.3m-7.5 6.8c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5m7.5 0c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5" />
          <path d="m27.2 20.6l-2.3-2.8 2.3-2.8c0.3-0.4 0.2-0.9-0.2-1.2s-1-0.2-1.3 0.2l-2 2.4-2-2.4c-0.3-0.4-0.9-0.4-1.3-0.2-0.4 0.3-0.5 0.8-0.2 1.2l2.3 2.8-2.3 2.8c-0.3 0.4-0.2 0.9 0.2 1.2s1 0.2 1.3-0.2l2-2.4 2 2.4c0.3 0.4 0.9 0.4 1.3 0.2 0.4-0.3 0.4-0.8 0.2-1.2" />
        </g>
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
      provider: 'box',
      pluginId: this.id,
      supportsRefreshToken: false,
    })

    this.defaultLocale = locale

    this.i18nInit()
    this.title = this.i18n('pluginNameBox')

    this.onFirstRender = this.onFirstRender.bind(this)
    this.render = this.render.bind(this)
  }

  install(): void {
    this.view = new ProviderViews(this, {
      provider: this.provider,
      loadAllFiles: true,
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
