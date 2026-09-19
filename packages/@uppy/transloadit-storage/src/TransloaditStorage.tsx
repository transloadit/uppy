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

export type TransloaditStorageOptions<
  M extends Meta = Meta,
  B extends Body = Body,
> = Omit<S3Options<M, B>, 'locale'> & {
  locale?: LocaleStrings<typeof locale>
  /**
   * Returns a Smart CDN URL for a stored file (its key). Sign it on your
   * server — no credentials live in the browser. The "Copy Smart CDN URL"
   * action is only offered when this is set.
   */
  getSmartCdnUrl?: (key: string) => Promise<string>
  /** Server-authorized, version-pinned original URL with Content-Disposition: attachment. */
  getDownloadUrl?: (key: string) => Promise<string>
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

  protected override get providerName(): string {
    return 'transloadit-storage'
  }

  declare opts: TransloaditStorageOptions<M, B> & S3Options<M, B>

  constructor(uppy: Uppy<M, B>, opts: TransloaditStorageOptions<M, B>) {
    // Fail before Uppy registers a half-installed provider with no view to tear down.
    if (opts.storeUploads) {
      const pluginId = opts.storeUploads.transloaditPluginId ?? 'Transloadit'
      const uploader = uppy.getPlugin(pluginId)
      if (!uploader)
        throw new Error(
          `Install @uppy/transloadit with id "${pluginId}" before using storeUploads`,
        )
      if (
        'assemblyOptions' in uploader.opts &&
        uploader.opts.assemblyOptions != null
      ) {
        throw new Error(
          'storeUploads cannot replace existing assemblyOptions; compose your upload pipeline with createStoreAssemblyOptions instead',
        )
      }
    }
    // No Workspace or prefix option: which ones the session sees is
    // Companion's call (its configuration, or the grant).
    super(uppy, {
      ...(opts as S3Options<M, B>),
      id: opts.id ?? 'TransloaditStorage',
      keepStateOnClose: opts.keepStateOnClose ?? true,
      // A standalone library is a manager, not a picker, unless told otherwise.
      mode: opts.mode ?? (opts.standalone ? 'manager' : 'picker'),
      // Applied below, once this plugin's own strings are merged in.
      locale: undefined,
    })
    this.defaultLocale = {
      strings: { ...(this.defaultLocale?.strings ?? {}), ...locale.strings },
    }
    this.i18nInit()
    this.setOptions({ locale: opts.locale })
    this.title = this.i18n('pluginNameTransloaditStorage')
    this.icon = () => <StorageIcon color="#0d8ceb" />
  }

  override builtInActions(): ProviderAction<M, B>[] {
    const { getSmartCdnUrl, getDownloadUrl } = this.opts
    const download: ProviderAction<M, B> = {
      id: 'transloadit:download',
      label: this.i18n('download'),
      appliesTo: 'file',
      refresh: false,
      run: async ({ item }) => {
        if (!getDownloadUrl) return
        const url = new URL(
          await getDownloadUrl(S3.keyOf(item.id)),
          window.location.href,
        )
        if (url.protocol !== 'https:' && url.protocol !== 'http:')
          throw new Error(this.i18n('downloadFailed'))
        const link = document.createElement('a')
        link.href = url.href
        link.download = ''
        link.rel = 'noreferrer'
        link.hidden = true
        document.body.appendChild(link)
        link.click()
        link.remove()
      },
    }
    const copyUrl: ProviderAction<M, B> = {
      id: 'transloadit:copySmartCdnUrl',
      label: this.i18n('copySmartCdnUrl'),
      appliesTo: 'file',
      refresh: false,
      run: async ({ item, uppy, view }) => {
        if (!getSmartCdnUrl) return
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
    const ordered = !getDownloadUrl
      ? base
      : deleteIndex === -1
        ? [...base, download]
        : [...base.slice(0, deleteIndex), download, ...base.slice(deleteIndex)]
    return getSmartCdnUrl ? [copyUrl, ...ordered] : ordered
  }

  override builtInToolbarActions() {
    const base = super.builtInToolbarActions()
    if (!this.opts.storeUploads && !this.opts.onUploadRequest) return base
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
          const normalizedPrefix = normalizePrefix(this.rootPrefix)
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
    const { storeUploads, reopenAfterUpload } = this.opts
    if (storeUploads) {
      const pluginId = storeUploads.transloaditPluginId ?? 'Transloadit'
      const transloadit = this.uppy.getPlugin(pluginId)
      if (!transloadit) {
        throw new Error(
          `Install @uppy/transloadit with id "${pluginId}" before using storeUploads`,
        )
      }
      transloadit.setOptions({
        waitForEncoding: true,
        assemblyOptions: createStoreAssemblyOptions(this.uppy, {
          ...storeUploads,
          storagePluginId: this.id,
        }),
        locale: {
          ...transloadit.opts.locale,
          strings: {
            encoding: this.i18n('storing'),
            ...transloadit.opts.locale?.strings,
          },
        },
      })
    }
    super.install()
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
