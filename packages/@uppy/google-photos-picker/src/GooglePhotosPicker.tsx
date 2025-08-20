import {
  type CompanionPluginOptions,
  RequestClient,
  tokenStorage,
} from '@uppy/companion-client'
import type { AsyncStore, BaseProviderPlugin, Body, Meta } from '@uppy/core'
import { UIPlugin, type Uppy } from '@uppy/core'
import {
  GooglePhotosIcon,
  GooglePickerView,
  type PickedItem,
} from '@uppy/provider-views'
import type { LocaleStrings } from '@uppy/utils'

import packageJson from '../package.json' with { type: 'json' }
import locale from './locale.js'

export type GooglePhotosPickerOptions = CompanionPluginOptions & {
  clientId: string
  locale?: LocaleStrings<typeof locale>
}

export default class GooglePhotosPicker<M extends Meta, B extends Body>
  extends UIPlugin<GooglePhotosPickerOptions, M, B>
  implements BaseProviderPlugin
{
  static VERSION = packageJson.version

  static requestClientId = GooglePhotosPicker.name

  type = 'acquirer'

  icon = GooglePhotosIcon

  storage: AsyncStore

  defaultLocale = locale

  constructor(uppy: Uppy<M, B>, opts: GooglePhotosPickerOptions) {
    super(uppy, opts)
    this.id = this.opts.id || 'GooglePhotosPicker'
    this.storage = this.opts.storage || tokenStorage

    this.defaultLocale = locale
    this.i18nInit()
    this.title = this.i18n('pluginNameGooglePhotosPicker')

    const client = new RequestClient(uppy, {
      pluginId: this.id,
      provider: 'url',
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      companionCookiesRule: this.opts.companionCookiesRule,
    })

    this.uppy.registerRequestClient(GooglePhotosPicker.requestClientId, client)
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
            requestClientId: GooglePhotosPicker.requestClientId,
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
      pickerType="photos"
      uppy={this.uppy}
      i18n={this.i18n}
      clientId={this.opts.clientId}
      onFilesPicked={this.handleFilesPicked}
    />
  )
}
