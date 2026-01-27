import {
  type CompanionPluginOptions,
  type GooglePickerState,
  RequestClient,
  tokenStorage,
} from '@uppy/companion-client'
import type { AsyncStore, BaseProviderPlugin, Body, Meta } from '@uppy/core'
import { UIPlugin, type Uppy } from '@uppy/core'
import { GoogleDriveIcon, GooglePickerView } from '@uppy/provider-views'
import type { LocaleStrings } from '@uppy/utils'

import packageJson from '../package.json' with { type: 'json' }
import locale from './locale.js'

declare module '@uppy/core' {
  export interface PluginTypeRegistry<M extends Meta, B extends Body> {
    GoogleDrivePicker: GoogleDrivePicker<M, B>
  }
}

export type GoogleDrivePickerOptions = CompanionPluginOptions & {
  clientId: string
  apiKey: string
  appId: string
  locale?: LocaleStrings<typeof locale>
}

export default class GoogleDrivePicker<M extends Meta, B extends Body>
  extends UIPlugin<GoogleDrivePickerOptions, M, B, GooglePickerState>
  implements BaseProviderPlugin
{
  static VERSION = packageJson.version

  static requestClientId = GoogleDrivePicker.name

  type = 'acquirer'

  icon = GoogleDriveIcon

  storage: AsyncStore

  defaultLocale = locale

  requestClientId = GoogleDrivePicker.requestClientId

  constructor(uppy: Uppy<M, B>, opts: GoogleDrivePickerOptions) {
    super(uppy, opts)
    this.id = this.opts.id || 'GoogleDrivePicker'
    this.storage = this.opts.storage || tokenStorage

    this.defaultLocale = locale
    this.i18nInit()
    this.title = this.i18n('pluginNameGoogleDrivePicker')

    this.setPluginState({
      loading: false,
      accessToken: undefined,
    })

    this.getPluginState = this.getPluginState.bind(this)
    this.setPluginState = this.setPluginState.bind(this)

    const requestClient = new RequestClient(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      companionCookiesRule: this.opts.companionCookiesRule,
      companionKeysParams: this.opts.companionKeysParams,
    })

    this.uppy.registerRequestClient(
      GoogleDrivePicker.requestClientId,
      requestClient,
    )
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

  render = () => (
    <GooglePickerView
      getPluginState={this.getPluginState}
      setPluginState={this.setPluginState}
      storage={this.storage}
      pickerType="drive"
      uppy={this.uppy}
      i18n={this.i18n}
      clientId={this.opts.clientId}
      apiKey={this.opts.apiKey}
      appId={this.opts.appId}
      requestClientId={GoogleDrivePicker.requestClientId}
      companionUrl={this.opts.companionUrl}
    />
  )
}
