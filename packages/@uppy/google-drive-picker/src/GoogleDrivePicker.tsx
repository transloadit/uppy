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
      files.map(({ id, mimeType, name, platform, ...rest }) => {
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
              platform,
              ...('url' in rest && { url: rest.url }),
            },
            requestClientId: GoogleDrivePicker.requestClientId,
          },
          ...(('metadata' in rest && {
            meta: rest.metadata,
          }) as Meta), // dunno how to type this
        }
      }),
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
