import {
  Provider,
  getAllowedHosts,
  tokenStorage,
  type CompanionPluginOptions,
} from '@uppy/companion-client'
import { UIPlugin, Uppy } from '@uppy/core'
import { ProviderViews } from '@uppy/provider-views'
import { h, type ComponentChild } from 'preact'

import type {
  UppyFile,
  Body,
  Meta,
  AsyncStore,
  UnknownProviderPlugin,
  UnknownProviderPluginState,
} from '@uppy/core'
import locale from './locale.js'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../package.json'

export type DropboxOptions = CompanionPluginOptions & { locale?: typeof locale }

export default class Dropbox<M extends Meta, B extends Body>
  extends UIPlugin<DropboxOptions, M, B, UnknownProviderPluginState>
  implements UnknownProviderPlugin<M, B>
{
  static VERSION = packageJson.version

  icon: () => h.JSX.Element

  provider: Provider<M, B>

  view!: ProviderViews<M, B>

  storage: AsyncStore

  files: UppyFile<M, B>[]

  rootFolderId: string | null = null

  constructor(uppy: Uppy<M, B>, opts: DropboxOptions) {
    super(uppy, opts)
    this.id = this.opts.id || 'Dropbox'
    this.type = 'acquirer'
    this.storage = this.opts.storage || tokenStorage
    this.files = []
    this.icon = () => (
      <svg
        className="uppy-DashboardTab-iconDropbox"
        aria-hidden="true"
        focusable="false"
        width="32"
        height="32"
        viewBox="0 0 32 32"
      >
        <path
          d="M10.5 7.5L5 10.955l5.5 3.454 5.5-3.454 5.5 3.454 5.5-3.454L21.5 7.5 16 10.955zM10.5 21.319L5 17.864l5.5-3.455 5.5 3.455zM16 17.864l5.5-3.455 5.5 3.455-5.5 3.455zM16 25.925l-5.5-3.455 5.5-3.454 5.5 3.454z"
          fill="currentcolor"
          fillRule="nonzero"
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
      provider: 'dropbox',
      pluginId: this.id,
      supportsRefreshToken: true,
    })

    this.defaultLocale = locale

    this.i18nInit()
    this.title = this.i18n('pluginNameDropbox')

    this.render = this.render.bind(this)
  }

  install(): void {
    this.view = new ProviderViews(this, {
      provider: this.provider,
      loadAllFiles: true,
      virtualList: true,
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

  render(state: unknown): ComponentChild {
    return this.view.render(state)
  }
}
