import type { Body, Meta, UploadResult, Uppy } from '@uppy/core'
import type { ProviderAction } from '@uppy/core/provider-views'
import type { LocaleStrings } from '@uppy/core/utils'
import S3, { type S3Options, StorageIcon } from '@uppy/s3'
import packageJson from '../package.json' with { type: 'json' }
import locale from './locale.js'
import {
  createStoreAssemblyOptions,
  normalizePrefix,
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
  /**
   * Takes over the toolbar's "Upload files" action, e.g. to open a full
   * Dashboard modal with remote sources. Receives the storage prefix of the
   * folder that is open; after uploading, call the plugin's
   * `refreshListing()` so the new files show up.
   */
  onUploadRequest?: (context: { prefix: string }) => void
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
      // A standalone library is a manager, not a picker, unless told otherwise.
      mode: opts.mode ?? (opts.standalone ? 'manager' : 'picker'),
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
    this.icon = () => <StorageIcon color="#0d8ceb" />
  }

  override builtInActions(): ProviderAction<M, B>[] {
    const { getSmartCdnUrl } = this.opts
    if (!getSmartCdnUrl) return super.builtInActions()
    const download: ProviderAction<M, B> = {
      id: 'transloadit:download',
      label: this.i18n('download'),
      appliesTo: 'file',
      refresh: false,
      run: async ({ item }) => {
        const url = await getSmartCdnUrl(S3.keyOf(item.id))
        const response = await fetch(url)
        if (!response.ok) throw new Error(this.i18n('downloadFailed'))
        const blobUrl = URL.createObjectURL(await response.blob())
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = item.data.name ?? 'download'
        link.click()
        // Revoking synchronously can cancel the download (Firefox); give the
        // browser time to open the URL first.
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000)
      },
    }
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
    const base = super.builtInActions()
    const deleteIndex = base.findIndex((action) => action.id === 's3:delete')
    const ordered =
      deleteIndex === -1
        ? [...base, download]
        : [...base.slice(0, deleteIndex), download, ...base.slice(deleteIndex)]
    return [copyUrl, ...ordered]
  }

  override builtInToolbarActions() {
    const base = super.builtInToolbarActions()
    if (!this.opts.storeUploads) return base
    const upload = {
      id: 'transloadit:uploadFiles',
      label: this.i18n('uploadFiles'),
      refresh: false,
      run: () => {
        // The host app can take over (e.g. a full Dashboard modal with
        // remote sources); otherwise a plain file picker owned by the
        // widget. Either way files go into the folder that is open
        // (storeUploads builds the Assembly params).
        if (this.opts.onUploadRequest) {
          const { currentFolderId } = this.getPluginState() as {
            currentFolderId?: string | null
          }
          const normalizedPrefix = normalizePrefix(this.opts.prefix)
          this.opts.onUploadRequest({
            prefix: currentFolderId
              ? decodeURIComponent(currentFolderId)
              : normalizedPrefix,
          })
          return
        }
        const input = document.createElement('input')
        input.type = 'file'
        input.multiple = true
        input.style.display = 'none'
        input.addEventListener('change', () => {
          this.uppy.addFiles(
            Array.from(input.files ?? []).map((file) => ({
              name: file.name,
              type: file.type,
              data: file,
              source: this.id,
              isRemote: false,
            })),
          )
          input.remove()
        })
        document.body.appendChild(input)
        input.click()
      },
    }
    return [upload, ...base]
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
          // Files are stored verbatim, not encoded: label the wait honestly.
          locale: { strings: { encoding: this.i18n('storing') } },
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
      try {
        this.uppy.clear()
      } catch {
        // Some uploaders refuse to clear mid-flight; the refresh matters more.
      }
      const dashboard = this.uppy.getPlugin('Dashboard') as
        | { showPanel?: (id: string) => void }
        | undefined
      dashboard?.showPanel?.(this.id)
      this.view.refreshCurrentFolder()
    }, 0)
  }
}

declare module '@uppy/core' {
  export interface PluginTypeRegistry<M extends Meta, B extends Body> {
    TransloaditStorage: TransloaditStorage<M, B>
  }
}
