import { UIPlugin, Uppy } from '@uppy/core'
import { ProviderViews } from '@uppy/provider-views'
import {
  Provider,
  tokenStorage,
  getAllowedHosts,
  type CompanionPluginOptions,
} from '@uppy/companion-client'
import { h, type ComponentChild } from 'preact'

import type {
  UppyFile,
  Body,
  Meta,
  AsyncStore,
  UnknownProviderPlugin,
  UnknownProviderPluginState,
} from '@uppy/core'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../package.json'
import locale from './locale.js'

export type GooglePhotosOptions = CompanionPluginOptions

export default class GooglePhotos<M extends Meta, B extends Body>
  extends UIPlugin<GooglePhotosOptions, M, B, UnknownProviderPluginState>
  implements UnknownProviderPlugin<M, B>
{
  static VERSION = packageJson.version

  icon: () => h.JSX.Element

  provider: Provider<M, B>

  view!: ProviderViews<M, B>

  storage: AsyncStore

  files: UppyFile<M, B>[]

  rootFolderId: string | null = null

  constructor(uppy: Uppy<M, B>, opts: GooglePhotosOptions) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.storage = this.opts.storage || tokenStorage
    this.files = []
    this.id = this.opts.id || 'GooglePhotos'
    this.icon = () => (
      <svg
        aria-hidden="true"
        focusable="false"
        width="32"
        height="32"
        viewBox="-7 -7 73 73"
      >
        <g fill="none" fill-rule="evenodd">
          <path d="M-3-3h64v64H-3z" />
          <g fill-rule="nonzero">
            <path
              fill="#FBBC04"
              d="M14.8 13.4c8.1 0 14.7 6.6 14.7 14.8v1.3H1.3c-.7 0-1.3-.6-1.3-1.3C0 20 6.6 13.4 14.8 13.4z"
            />
            <path
              fill="#EA4335"
              d="M45.6 14.8c0 8.1-6.6 14.7-14.8 14.7h-1.3V1.3c0-.7.6-1.3 1.3-1.3C39 0 45.6 6.6 45.6 14.8z"
            />
            <path
              fill="#4285F4"
              d="M44.3 45.6c-8.2 0-14.8-6.6-14.8-14.8v-1.3h28.2c.7 0 1.3.6 1.3 1.3 0 8.2-6.6 14.8-14.8 14.8z"
            />
            <path
              fill="#34A853"
              d="M13.4 44.3c0-8.2 6.6-14.8 14.8-14.8h1.3v28.2c0 .7-.6 1.3-1.3 1.3-8.2 0-14.8-6.6-14.8-14.8z"
            />
          </g>
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
      provider: 'googlephotos',
      pluginId: this.id,
      supportsRefreshToken: true,
    })

    this.defaultLocale = locale

    this.i18nInit()
    this.title = this.i18n('pluginNameGooglePhotos')

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

  render(state: unknown): ComponentChild {
    const { partialTree, currentFolderId } = this.getPluginState()

    const foldersInThisFolder = partialTree.filter(
      (i) => i.type === 'folder' && i.parentId === currentFolderId,
    )

    if (foldersInThisFolder.length === 0) {
      return this.view.render(state, {
        viewType: 'grid',
        showFilter: false,
        showTitles: false,
      })
    }
    return this.view.render(state)
  }
}
