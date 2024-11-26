import { h } from 'preact'
import { UIPlugin, Uppy } from '@uppy/core'
import { GooglePickerView } from '@uppy/provider-views'
import {
  RequestClient,
  type CompanionPluginOptions,
  tokenStorage,
} from '@uppy/companion-client'

import type { PickedItem } from '@uppy/provider-views/lib/GooglePicker/googlePicker.js'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import type { AsyncStore, BaseProviderPlugin } from '@uppy/core/lib/Uppy.js'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../package.json'
import locale from './locale.ts'

const Icon = () => (
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

export type GooglePhotosPickerOptions = CompanionPluginOptions & {
  clientId: string
}

export default class GooglePhotosPicker<
    M extends Meta & { width: number; height: number },
    B extends Body,
  >
  extends UIPlugin<GooglePhotosPickerOptions, M, B>
  implements BaseProviderPlugin
{
  static VERSION = packageJson.version

  static requestClientId = GooglePhotosPicker.name

  type = 'acquirer'

  icon = Icon

  storage: AsyncStore

  defaultLocale = locale

  constructor(uppy: Uppy<M, B>, opts: GooglePhotosPickerOptions) {
    super(uppy, opts)
    this.id = this.opts.id || 'GooglePhotosPicker'
    this.storage = this.opts.storage || tokenStorage

    this.i18nInit()
    this.title = this.i18n('pluginNameGooglePhotos')

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
            requestClientId: GooglePhotosPicker.requestClientId,
          },
        }
      }),
    )
  }

  render = () => (
    <GooglePickerView
      storage={this.storage}
      pickerType="photos"
      uppy={this.uppy}
      clientId={this.opts.clientId}
      onFilesPicked={this.handleFilesPicked}
    />
  )
}
