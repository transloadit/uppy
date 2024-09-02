import { UIPlugin, Uppy } from '@uppy/core'
import { GooglePickerView } from '@uppy/provider-views'
import {
  Provider,
  getAllowedHosts,
  type CompanionPluginOptions,
} from '@uppy/companion-client'
import { h, type ComponentChild } from 'preact'

import type { UppyFile, Body, Meta } from '@uppy/utils/lib/UppyFile'
import type { UnknownProviderPluginState } from '@uppy/core/lib/Uppy.js'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../package.json'
import locale from './locale.ts'

export type GooglePickerOptions = CompanionPluginOptions & {
  clientId: string,
  apiKey: string,
  appId: string,
}

export default class GooglePicker<
  M extends Meta,
  B extends Body,
> extends UIPlugin<GooglePickerOptions, M, B, UnknownProviderPluginState> {
  static VERSION = packageJson.version

  icon: () => h.JSX.Element

  provider: Provider<M, B>

  files: UppyFile<M, B>[]

  constructor(uppy: Uppy<M, B>, opts: GooglePickerOptions) {
    super(uppy, opts)
    this.type = 'acquirer'
    this.files = []
    this.id = this.opts.id || 'GooglePicker'
    this.icon = () => (
      <svg
        viewBox="-6 -6 36 36"
        aria-hidden="true"
        focusable="false"
        width="32"
        height="32"
      >
        <path fill="#4285F4" d="m22.6 12.3-.2-2.3H12v4.3h6a5 5 0 0 1-2.3 3.3v2.7h3.6c2-1.9 3.3-4.7 3.3-8z"/>
        <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .6-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8A11 11 0 0 0 12 23z"/>
        <path fill="#FBBC05" d="M5.8 14a6.6 6.6 0 0 1 0-4V7H2.2a10.9 10.9 0 0 0 0 10L5 14.6l.8-.6z"/>
        <path fill="#EA4335" d="M12 5.4A6 6 0 0 1 16.2 7L19.4 4A11 11 0 0 0 2.2 7l3.6 2.8A6.6 6.6 0 0 1 12 5.4z"/>
        <path fill="none" d="M1 1h22v22H1z"/>
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
    
      provider: 'googlepicker',
      pluginId: this.id,
    })

    this.defaultLocale = locale

    this.i18nInit()
    this.title = this.i18n('pluginNameGooglePicker')

    this.render = this.render.bind(this)
  }

  install(): void {
    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall(): void {
    this.unmount()
  }

  render(): ComponentChild {
    return GooglePickerView({
      provider: this.provider, uppy: this.uppy,
      clientId: this.opts.clientId,
      apiKey: this.opts.apiKey,
      appId: this.opts.appId,
    })
  }
}
