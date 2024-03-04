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

export type OneDriveOptions = CompanionPluginOptions

export default class OneDrive<M extends Meta, B extends Body> extends UIPlugin<
  OneDriveOptions,
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

  constructor(uppy: Uppy<M, B>, opts: OneDriveOptions) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.files = []
    this.storage = this.opts.storage || tokenStorage
    this.id = this.opts.id || 'OneDrive'
    this.icon = () => (
      <svg
        aria-hidden="true"
        focusable="false"
        width="32"
        height="32"
        viewBox="0 0 32 32"
      >
        <g fill="none" fillRule="nonzero">
          <path
            d="M13.39 12.888l4.618 2.747 2.752-1.15a4.478 4.478 0 012.073-.352 6.858 6.858 0 00-5.527-5.04 6.895 6.895 0 00-6.876 2.982l.07-.002a5.5 5.5 0 012.89.815z"
            fill="#0364B8"
          />
          <path
            d="M13.39 12.887v.001a5.5 5.5 0 00-2.89-.815l-.07.002a5.502 5.502 0 00-4.822 2.964 5.43 5.43 0 00.38 5.62l4.073-1.702 1.81-.757 4.032-1.685 2.105-.88-4.619-2.748z"
            fill="#0078D4"
          />
          <path
            d="M22.833 14.133a4.479 4.479 0 00-2.073.352l-2.752 1.15.798.475 2.616 1.556 1.141.68 3.902 2.321a4.413 4.413 0 00-.022-4.25 4.471 4.471 0 00-3.61-2.284z"
            fill="#1490DF"
          />
          <path
            d="M22.563 18.346l-1.141-.68-2.616-1.556-.798-.475-2.105.88L11.87 18.2l-1.81.757-4.073 1.702A5.503 5.503 0 0010.5 23h12.031a4.472 4.472 0 003.934-2.333l-3.902-2.321z"
            fill="#28A8EA"
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
      provider: 'onedrive',
      pluginId: this.id,
      supportsRefreshToken: false,
    })

    this.defaultLocale = locale

    this.i18nInit()
    this.title = this.i18n('pluginNameOneDrive')

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
