import { h } from 'preact'
import { UIPlugin, Uppy } from '@uppy/core'
import { GooglePickerView } from '@uppy/provider-views'
import {
  RequestClient,
  type CompanionPluginOptions,
  tokenStorage,
} from '@uppy/companion-client'

import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import {
  type PickedItem,
  type PluginState,
} from '@uppy/provider-views/lib/GooglePicker/GooglePickerView.js'
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
    viewBox="0 0 32 32"
  >
    <g fillRule="nonzero" fill="none">
      <path
        d="M6.663 22.284l.97 1.62c.202.34.492.609.832.804l3.465-5.798H5c0 .378.1.755.302 1.096l1.361 2.278z"
        fill="#0066DA"
      />
      <path
        d="M16 12.09l-3.465-5.798c-.34.195-.63.463-.832.804l-6.4 10.718A2.15 2.15 0 005 18.91h6.93L16 12.09z"
        fill="#00AC47"
      />
      <path
        d="M23.535 24.708c.34-.195.63-.463.832-.804l.403-.67 1.928-3.228c.201-.34.302-.718.302-1.096h-6.93l1.474 2.802 1.991 2.996z"
        fill="#EA4335"
      />
      <path
        d="M16 12.09l3.465-5.798A2.274 2.274 0 0018.331 6h-4.662c-.403 0-.794.11-1.134.292L16 12.09z"
        fill="#00832D"
      />
      <path
        d="M20.07 18.91h-8.14l-3.465 5.798c.34.195.73.292 1.134.292h12.802c.403 0 .794-.11 1.134-.292L20.07 18.91z"
        fill="#2684FC"
      />
      <path
        d="M23.497 12.455l-3.2-5.359a2.252 2.252 0 00-.832-.804L16 12.09l4.07 6.82h6.917c0-.377-.1-.755-.302-1.096l-3.188-5.359z"
        fill="#FFBA00"
      />
    </g>
  </svg>
)

export type GoogleDrivePickerOptions = CompanionPluginOptions & {
  clientId: string
  apiKey: string
  appId: string
}

export default class GoogleDrivePicker<
    M extends Meta & { width: number; height: number },
    B extends Body,
  >
  extends UIPlugin<GoogleDrivePickerOptions, M, B, PluginState>
  implements BaseProviderPlugin
{
  static VERSION = packageJson.version

  static requestClientId = GoogleDrivePicker.name

  type = 'acquirer'

  icon = Icon

  storage: AsyncStore

  defaultLocale = locale

  constructor(uppy: Uppy<M, B>, opts: GoogleDrivePickerOptions) {
    super(uppy, opts)
    this.id = this.opts.id || 'GoogleDrivePicker'
    this.storage = this.opts.storage || tokenStorage

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
      plugin={this}
      uppy={this.uppy}
      clientId={this.opts.clientId}
      apiKey={this.opts.apiKey}
      appId={this.opts.appId}
      onFilesPicked={this.handleFilesPicked}
    />
  )
}
