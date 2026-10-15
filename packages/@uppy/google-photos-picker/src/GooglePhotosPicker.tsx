import type { AsyncStore, BaseProviderPlugin, Body, Meta } from '@uppy/core'
import { UIPlugin, type Uppy } from '@uppy/core'
import {
  type CompanionPluginOptions,
  type GooglePickerState,
  RequestClient,
  tokenStorage,
} from '@uppy/core/companion-client'
import { GooglePhotosIcon, GooglePickerView } from '@uppy/core/provider-views'
import type { LocaleStrings } from '@uppy/core/utils'

import packageJson from '../package.json' with { type: 'json' }
import locale from './locale.js'

declare module '@uppy/core' {
  export interface PluginTypeRegistry<M extends Meta, B extends Body> {
    GooglePhotosPicker: GooglePhotosPicker<M, B>
  }
}

export type GooglePhotosPickerOptions = CompanionPluginOptions & {
  clientId: string
  locale?: LocaleStrings<typeof locale>
}

export default class GooglePhotosPicker<M extends Meta, B extends Body>
  extends UIPlugin<GooglePhotosPickerOptions, M, B, GooglePickerState>
  implements BaseProviderPlugin
{
  static VERSION = packageJson.version

  static requestClientId = GooglePhotosPicker.name

  override type = 'acquirer'

  icon = GooglePhotosIcon

  storage: AsyncStore

  override defaultLocale = locale

  requestClientId = GooglePhotosPicker.requestClientId

  constructor(uppy: Uppy<M, B>, opts: GooglePhotosPickerOptions) {
    super(uppy, opts)
    this.id = this.opts.id || 'GooglePhotosPicker'
    this.storage = this.opts.storage || tokenStorage

    this.defaultLocale = locale
    this.i18nInit()
    this.title = this.i18n('pluginNameGooglePhotosPicker')

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
      GooglePhotosPicker.requestClientId,
      requestClient,
    )
  }

  override install(): void {
    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }

  override uninstall(): void {
    this.unmount()
  }

  override render = () => (
    <GooglePickerView
      getPluginState={this.getPluginState}
      setPluginState={this.setPluginState}
      storage={this.storage}
      pickerType="photos"
      uppy={this.uppy}
      i18n={this.i18n}
      clientId={this.opts.clientId}
      requestClientId={GooglePhotosPicker.requestClientId}
      companionUrl={this.opts.companionUrl}
    />
  )
}
