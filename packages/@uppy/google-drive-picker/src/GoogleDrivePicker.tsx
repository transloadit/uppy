import {
  type CompanionPluginOptions,
  RequestClient,
  tokenStorage,
} from '@uppy/companion-client'
import type { AsyncStore, BaseProviderPlugin, Body, Meta } from '@uppy/core'
import { UIPlugin, type Uppy } from '@uppy/core'
import {
  GoogleDriveIcon,
  GooglePickerView,
  mapPickerFile,
  type PickedItem,
} from '@uppy/provider-views'
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
  extends UIPlugin<GoogleDrivePickerOptions, M, B>
  implements BaseProviderPlugin
{
  static VERSION = packageJson.version

  static requestClientId = GoogleDrivePicker.name

  type = 'acquirer'

  icon = GoogleDriveIcon

  storage: AsyncStore

  defaultLocale = locale

  constructor(uppy: Uppy<M, B>, opts: GoogleDrivePickerOptions) {
    super(uppy, opts)
    this.id = this.opts.id || 'GoogleDrivePicker'
    this.storage = this.opts.storage || tokenStorage

    this.defaultLocale = locale
    this.i18nInit()
    this.title = this.i18n('pluginNameGoogleDrivePicker')

    const client = new RequestClient(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      companionCookiesRule: this.opts.companionCookiesRule,
    })

    this.uppy.registerRequestClient(GoogleDrivePicker.requestClientId, client)
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

  private handleFilesPicked = async (
    files: PickedItem[],
    accessToken: string,
  ) => {
    this.uppy.addFiles(
      files.map((file) =>
        mapPickerFile(
          {
            requestClientId: GoogleDrivePicker.requestClientId,
            accessToken,
            companionUrl: this.opts.companionUrl,
          },
          file,
        ),
      ),
    )
  }

  render = () => (
    <GooglePickerView
      storage={this.storage}
      pickerType="drive"
      uppy={this.uppy}
      i18n={this.i18n}
      clientId={this.opts.clientId}
      apiKey={this.opts.apiKey}
      appId={this.opts.appId}
      onFilesPicked={this.handleFilesPicked}
    />
  )
}
