import { h } from 'preact'
import { UIPlugin, Uppy } from '@uppy/core'
import { GooglePickerView } from '@uppy/provider-views'
import { GoogleDriveIcon } from '@uppy/provider-views/lib/GooglePicker/icons.js'
import {
  RequestClient,
  type CompanionPluginOptions,
  tokenStorage,
} from '@uppy/companion-client'

import type { PickedItem } from '@uppy/provider-views/lib/GooglePicker/googlePicker.js'
import type { Body, Meta, AsyncStore, BaseProviderPlugin } from '@uppy/core'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../package.json'
import locale from './locale.js'

export type GoogleDrivePickerOptions = CompanionPluginOptions & {
  clientId: string
  apiKey: string
  appId: string
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
    this.title = this.i18n('pluginNameGoogleDrive')

    const client = new RequestClient(uppy, {
      pluginId: this.id,
      provider: 'url',
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
      files.map(({ id, mimeType, name, ...rest }) => {
        return {
          source: this.id,
          name,
          type: mimeType,
          data: {
            size: null, // defer to companion to determine size
          },
          isRemote: true,
          remote: {
            companionUrl: this.opts.companionUrl,
            url: `${this.opts.companionUrl}/google-picker/get`,
            body: {
              fileId: id,
              accessToken,
              ...rest,
            },
            requestClientId: GoogleDrivePicker.requestClientId,
          },
        }
      }),
    )
  }

  render = () => (
    <GooglePickerView
      storage={this.storage}
      pickerType="drive"
      uppy={this.uppy}
      clientId={this.opts.clientId}
      apiKey={this.opts.apiKey}
      appId={this.opts.appId}
      onFilesPicked={this.handleFilesPicked}
    />
  )
}
