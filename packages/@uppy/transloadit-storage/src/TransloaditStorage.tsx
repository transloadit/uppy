import {
  type Body,
  type Meta,
  type UploadResult,
  type Uppy,
  UserFacingApiError,
} from '@uppy/core'
import type {
  ProviderAction,
  ProviderToolbarAction,
} from '@uppy/core/provider-views'
import type { LocaleStrings } from '@uppy/core/utils'
import S3, { type S3Options, StorageIcon } from '@uppy/s3'
import packageJson from '../package.json' with { type: 'json' }
import locale from './locale.js'
import {
  createStoreAssemblyOptions,
  openFolderKey,
  type StoreUploadsOptions,
} from './storeAssemblyOptions.js'

export type TransloaditStorageOptions<
  M extends Meta = Meta,
  B extends Body = Body,
> = Omit<S3Options<M, B>, 'locale'> & {
  /** This plugin's strings and the S3 plugin's it shows too. */
  locale?: {
    strings: LocaleStrings<typeof locale>['strings'] &
      NonNullable<S3Options['locale']>['strings']
  }
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

/** The `@uppy/transloadit` plugin `storeUploads` configures. */
function getStoreUploader<M extends Meta, B extends Body>(
  uppy: Uppy<M, B>,
  { transloaditPluginId = 'Transloadit' }: StoreUploadsOptions,
) {
  const uploader = uppy.getPlugin(transloaditPluginId)
  if (!uploader) {
    throw new Error(
      `Install @uppy/transloadit with id "${transloaditPluginId}" before using storeUploads`,
    )
  }
  return uploader
}

/** Starts a browser download of `url` (an http(s) URL, or one relative to the page). */
function download(url: string, invalidUrlMessage: string): void {
  const { href, protocol } = new URL(url, window.location.href)
  // A user-facing error, so the Dashboard shows this message rather than a
  // generic "the action failed".
  if (protocol !== 'https:' && protocol !== 'http:')
    throw new UserFacingApiError(invalidUrlMessage)
  const link = document.createElement('a')
  link.href = href
  link.download = ''
  link.rel = 'noreferrer'
  link.hidden = true
  document.body.appendChild(link)
  link.click()
  link.remove()
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

  declare opts: TransloaditStorageOptions<M, B>

  constructor(uppy: Uppy<M, B>, opts: TransloaditStorageOptions<M, B>) {
    // Fail before Uppy registers a half-installed provider with no view to tear down.
    if (opts.storeUploads) {
      const uploader = getStoreUploader(uppy, opts.storeUploads)
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
      ...opts,
      id: opts.id ?? 'TransloaditStorage',
      keepStateOnClose: opts.keepStateOnClose ?? true,
      // A standalone library is a manager, not a picker, unless told otherwise.
      mode: opts.mode ?? (opts.standalone ? 'manager' : 'picker'),
    })
    this.defaultLocale = {
      strings: { ...this.defaultLocale?.strings, ...locale.strings },
    }
    this.i18nInit()
    this.title = this.i18n('pluginNameTransloaditStorage')
    this.icon = () => <StorageIcon color="#0d8ceb" />
  }

  /**
   * With `storeUploads`, files dropped on the panel are stored in the folder
   * that is open, so the Dashboard accepts drops there (see its
   * `PickerPanelContent`).
   */
  get acceptsFileDrops(): boolean {
    return this.opts.storeUploads != null && this.canWrite
  }

  override builtInActions(): ProviderAction<M, B>[] {
    const { getSmartCdnUrl, getDownloadUrl } = this.opts
    const actions = super.builtInActions()
    if (getDownloadUrl) {
      // Before the destructive action, which stays last.
      const deleteIndex = actions.findIndex(({ id }) => id === 's3:delete')
      actions.splice(deleteIndex === -1 ? actions.length : deleteIndex, 0, {
        id: 'transloadit:download',
        label: this.i18n('download'),
        appliesTo: 'file',
        refresh: false,
        run: async ({ item }) => {
          download(
            await getDownloadUrl(S3.keyOf(item.id)),
            this.i18n('downloadFailed'),
          )
        },
      })
    }
    if (getSmartCdnUrl) {
      actions.unshift({
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
      })
    }
    return actions
  }

  override builtInToolbarActions(): ProviderToolbarAction<M, B>[] {
    const actions = super.builtInToolbarActions()
    const { storeUploads, onUploadRequest } = this.opts
    if (!storeUploads && !onUploadRequest) return actions
    return [
      {
        id: 'transloadit:uploadFiles',
        label: this.i18n('uploadFiles'),
        refresh: false,
        // The host app can take over (e.g. a full Dashboard modal with remote
        // sources); otherwise a plain file picker owned by the widget. Either
        // way files go into the folder that is open (storeUploads builds the
        // Assembly params).
        run: () => {
          if (onUploadRequest) onUploadRequest({ prefix: openFolderKey(this) })
          else this.#pickFiles()
        },
      },
      ...actions,
    ]
  }

  /** Lets the user pick local files and adds them to Uppy. */
  #pickFiles(): void {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.style.display = 'none'
    input.addEventListener('change', () => {
      this.uppy.addFiles(
        Array.from(input.files ?? [], (file) => ({
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
  }

  override install(): void {
    const { storeUploads, reopenAfterUpload } = this.opts
    if (storeUploads) {
      const transloadit = getStoreUploader(this.uppy, storeUploads)
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
    if (result.failed?.length) return
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
