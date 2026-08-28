import type { Body, Meta, Uppy } from '@uppy/core'
import type { ProviderAction } from '@uppy/core/provider-views'
import type { LocaleStrings } from '@uppy/core/utils'
// biome-ignore lint/style/useImportType: h is not a type
import { h } from '@uppy/core/utils/preact'
import S3, { type S3Options } from '@uppy/s3'
import packageJson from '../package.json' with { type: 'json' }
import locale from './locale.js'
import { getSignedSmartCdnUrl } from './smartCdn.js'

export type TransloaditStorageOptions = Omit<S3Options, 'bucket' | 'locale'> & {
  locale?: LocaleStrings<typeof locale>
  /** Workspace slug; Transloadit Storage exposes it as the S3 bucket. */
  workspace: string
  /** Optional folder prefix to confine browsing to, e.g. `customer-123/`. */
  prefix?: string
  /** Auth Key / Secret used to sign Smart CDN URLs. Omit for unsigned URLs. */
  authKey?: string
  authSecret?: string
  /** Template that serves files from Storage. */
  template?: string
  /** See SmartCdnUrlOptions.endpoint. */
  cdnEndpoint?: string
  urlParams?: Record<string, string | number | boolean>
}

const DEFAULT_TEMPLATE = 'builtin/storage-serve@0.0.1'

/**
 * Transloadit Storage = the S3 provider plugin pointed at Transloadit's
 * S3-compatible endpoint, plus Transloadit-specific actions.
 */
export default class TransloaditStorage<
  M extends Meta,
  B extends Body,
> extends S3<M, B> {
  static override VERSION = packageJson.version

  declare opts: TransloaditStorageOptions & S3Options

  constructor(uppy: Uppy<M, B>, opts: TransloaditStorageOptions) {
    const { workspace, prefix, ...rest } = opts
    super(uppy, {
      ...(rest as S3Options),
      id: opts.id ?? 'TransloaditStorage',
      bucket: prefix ? `${workspace}/${prefix}` : workspace,
      locale: undefined,
    })
    this.opts = {
      ...this.opts,
      workspace,
      prefix,
    } as TransloaditStorageOptions & S3Options
    this.defaultLocale = {
      strings: { ...(this.defaultLocale?.strings ?? {}), ...locale.strings },
    }
    this.i18nInit()
    this.setOptions({ locale: opts.locale })
    this.title = this.i18n('pluginNameTransloaditStorage')
    this.icon = () => (
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <g fill="none" fill-rule="evenodd">
          <ellipse cx="16" cy="9" rx="9" ry="3.5" fill="#0d8ceb" />
          <path
            d="M7 9v14c0 1.93 4.03 3.5 9 3.5s9-1.57 9-3.5V9"
            stroke="#0d8ceb"
            stroke-width="2"
          />
          <path
            d="M7 16c0 1.93 4.03 3.5 9 3.5s9-1.57 9-3.5"
            stroke="#0d8ceb"
            stroke-width="2"
          />
        </g>
      </svg>
    )
  }

  async smartCdnUrlFor(key: string): Promise<string> {
    const { workspace, template, authKey, authSecret, cdnEndpoint, urlParams } =
      this.opts
    return getSignedSmartCdnUrl({
      workspace,
      template: template ?? DEFAULT_TEMPLATE,
      input: key,
      authKey,
      authSecret,
      endpoint: cdnEndpoint,
      urlParams,
    })
  }

  override builtInActions(): ProviderAction<M, B>[] {
    const copyUrl: ProviderAction<M, B> = {
      id: 'transloadit:copySmartCdnUrl',
      label: this.i18n('copySmartCdnUrl'),
      appliesTo: 'file',
      refresh: false,
      run: async ({ item, uppy }) => {
        const url = await this.smartCdnUrlFor(S3.keyOf(item.id))
        try {
          await navigator.clipboard.writeText(url)
          uppy.info(this.i18n('copiedSmartCdnUrl'), 'info', 3000)
        } catch {
          window.prompt(this.i18n('smartCdnUrlPrompt'), url)
        }
      },
    }
    return [copyUrl, ...super.builtInActions()]
  }
}

declare module '@uppy/core' {
  export interface PluginTypeRegistry<M extends Meta, B extends Body> {
    TransloaditStorage: TransloaditStorage<M, B>
  }
}
