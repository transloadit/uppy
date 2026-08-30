import type { Body, Meta, UploadResult, Uppy } from '@uppy/core'
import type { ProviderAction } from '@uppy/core/provider-views'
import type { LocaleStrings } from '@uppy/core/utils'
import S3, { type S3Options } from '@uppy/s3'
import packageJson from '../package.json' with { type: 'json' }
import locale from './locale.js'
import {
  createStoreAssemblyOptions,
  type StoreUploadsOptions,
} from './storeAssemblyOptions.js'

export type TransloaditStorageOptions = Omit<S3Options, 'bucket' | 'locale'> & {
  locale?: LocaleStrings<typeof locale>
  /**
   * Workspace slug; Transloadit Storage exposes it as the S3 bucket. Used as
   * the bucket for development Companions that allow bucket auth; with
   * `getGrant` the grant decides.
   */
  workspace: string
  /** Optional folder prefix to confine browsing to, e.g. `customer-123/`. */
  prefix?: string
  /**
   * Returns a Smart CDN URL for a stored file (its key). Sign it on your
   * server — no credentials live in the browser. The "Copy Smart CDN URL"
   * action is only offered when this is set.
   */
  getSmartCdnUrl?: (key: string) => Promise<string>
  /**
   * Store uploads in the folder that is open in this panel, through an
   * `@uppy/transloadit` plugin installed on the same Uppy instance. You sign
   * the Assembly params (server-side, ideally); see `createStoreAssemblyOptions`
   * to wire it yourself instead.
   */
  storeUploads?: StoreUploadsOptions
  /**
   * After an upload without failures: clear the files, reopen this panel and
   * refresh the folder so the new files show up. Default: false.
   */
  reopenAfterUpload?: boolean
}

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
      keepStateOnClose: opts.keepStateOnClose ?? true,
      // With a grant the server decides; the bucket is the development fallback.
      ...(!opts.getGrant && {
        bucket: prefix ? `${workspace}/${prefix}` : workspace,
      }),
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

  override builtInActions(): ProviderAction<M, B>[] {
    const { getSmartCdnUrl } = this.opts
    if (!getSmartCdnUrl) return super.builtInActions()
    const copyUrl: ProviderAction<M, B> = {
      id: 'transloadit:copySmartCdnUrl',
      label: this.i18n('copySmartCdnUrl'),
      appliesTo: 'file',
      refresh: false,
      run: async ({ item, uppy, view }) => {
        const url = await getSmartCdnUrl(S3.keyOf(item.id))
        try {
          await navigator.clipboard.writeText(url)
          uppy.info(this.i18n('copiedSmartCdnUrl'), 'info', 3000)
        } catch {
          // No clipboard access (permission denied, insecure origin): show the
          // URL in a dialog so it can be copied by hand.
          await view.prompt({
            title: this.i18n('smartCdnUrlPrompt'),
            defaultValue: url,
          })
        }
      },
    }
    return [copyUrl, ...super.builtInActions()]
  }

  override install(): void {
    super.install()
    const { storeUploads, reopenAfterUpload } = this.opts
    if (storeUploads) {
      const transloadit = this.uppy.getPlugin('Transloadit')
      if (transloadit) {
        transloadit.setOptions({
          assemblyOptions: createStoreAssemblyOptions(this.uppy, {
            ...storeUploads,
            storagePluginId: this.id,
          }),
        })
      } else {
        this.uppy.log(
          '[TransloaditStorage] storeUploads needs an @uppy/transloadit plugin installed before this plugin (or use createStoreAssemblyOptions yourself)',
          'warning',
        )
      }
    }
    if (reopenAfterUpload) this.uppy.on('complete', this.#reopenAfterUpload)
  }

  override uninstall(): void {
    this.uppy.off('complete', this.#reopenAfterUpload)
    super.uninstall()
  }

  /**
   * `complete` fires once every uploader, including @uppy/transloadit's
   * post-processing (waitForEncoding), has finished — so the stored files
   * exist by now. Clearing on the next macrotask lets the other `complete`
   * listeners (Dashboard's own success state) run on the final result first.
   */
  #reopenAfterUpload = (result: UploadResult<M, B>): void => {
    if (result.failed && result.failed.length > 0) return
    setTimeout(() => {
      this.uppy.clear()
      const dashboard = this.uppy.getPlugin('Dashboard') as
        | { showPanel?: (id: string) => void }
        | undefined
      dashboard?.showPanel?.(this.id)
      void this.view.refreshCurrentFolder()
    }, 0)
  }
}

declare module '@uppy/core' {
  export interface PluginTypeRegistry<M extends Meta, B extends Body> {
    TransloaditStorage: TransloaditStorage<M, B>
  }
}
