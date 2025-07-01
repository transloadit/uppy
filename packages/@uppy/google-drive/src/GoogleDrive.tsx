import {
  type CompanionPluginOptions,
  getAllowedHosts,
  Provider,
  tokenStorage,
} from '@uppy/companion-client'
import type {
  AsyncStore,
  Body,
  Meta,
  UnknownProviderPlugin,
  UnknownProviderPluginState,
  UppyFile,
} from '@uppy/core'
import { UIPlugin, type Uppy } from '@uppy/core'
import type { ProviderViews } from '@uppy/provider-views'

import type { LocaleStrings } from '@uppy/utils/lib/Translator'
// biome-ignore lint/style/useImportType: h is not a type
import { type ComponentChild, h } from 'preact'
import packageJson from '../package.json' with { type: 'json' }
import DriveProviderViews from './DriveProviderViews.js'
import locale from './locale.js'

export type GoogleDriveOptions = CompanionPluginOptions & {
  locale?: LocaleStrings<typeof locale>
}

export default class GoogleDrive<M extends Meta, B extends Body>
  extends UIPlugin<GoogleDriveOptions, M, B, UnknownProviderPluginState>
  implements UnknownProviderPlugin<M, B>
{
  static VERSION = packageJson.version

  icon: () => h.JSX.Element

  provider: Provider<M, B>

  view!: ProviderViews<M, B>

  storage: AsyncStore

  files: UppyFile<M, B>[]

  rootFolderId: string | null = 'root'

  constructor(uppy: Uppy<M, B>, opts: GoogleDriveOptions) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.storage = this.opts.storage || tokenStorage
    this.files = []
    this.id = this.opts.id || 'GoogleDrive'
    this.icon = () => (
      <svg
        aria-hidden="true"
        focusable="false"
        width="32"
        height="32"
        viewBox="0 0 32 32"
      >
        <g fillRule="nonzero" fill="none">
          <path
            d="M6.663 22.284l.97 1.62c.202.34.492.609.832.804l3.465-5.798H5c0 .378.1.755.302 1.096l1.361 2.278z"
            fill="#0066DA"
          />
          <path
            d="M16 12.09l-3.465-5.798c-.34.195-.63.463-.832.804l-6.4 10.718A2.15 2.15 0 005 18.91h6.93L16 12.09z"
            fill="#00AC47"
          />
          <path
            d="M23.535 24.708c.34-.195.63-.463.832-.804l.403-.67 1.928-3.228c.201-.34.302-.718.302-1.096h-6.93l1.474 2.802 1.991 2.996z"
            fill="#EA4335"
          />
          <path
            d="M16 12.09l3.465-5.798A2.274 2.274 0 0018.331 6h-4.662c-.403 0-.794.11-1.134.292L16 12.09z"
            fill="#00832D"
          />
          <path
            d="M20.07 18.91h-8.14l-3.465 5.798c.34.195.73.292 1.134.292h12.802c.403 0 .794-.11 1.134-.292L20.07 18.91z"
            fill="#2684FC"
          />
          <path
            d="M23.497 12.455l-3.2-5.359a2.252 2.252 0 00-.832-.804L16 12.09l4.07 6.82h6.917c0-.377-.1-.755-.302-1.096l-3.188-5.359z"
            fill="#FFBA00"
          />
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
      provider: 'drive',
      pluginId: this.id,
      supportsRefreshToken: true,
    })

    this.defaultLocale = locale

    this.i18nInit()
    this.title = this.i18n('pluginNameGoogleDrive')

    this.render = this.render.bind(this)
  }

  install(): void {
    this.view = new DriveProviderViews(this, {
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
