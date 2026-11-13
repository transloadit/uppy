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

/**
 * @experimental `@uppy/transloadit-storage` is experimental: its options,
 * behaviour and Companion endpoints will change incompatibly, also in
 * minor releases.
 */
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
 *
 * @experimental `@uppy/transloadit-storage` is experimental: its options,
 * behaviour and Companion endpoints will change incompatibly, also in
 * minor releases.
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

  /** Tracks the previous loading state so we only rebuild actions on transitions. */
  #lastLoading: boolean | string = false

  /**
   * The destination prefix captured when the first file in a batch is accepted.
   * Signing uses this snapshot instead of reading the current folder, so
   * navigation after acceptance cannot change the destination.
   */
  #pinnedDestination: string | null = null

  /** Tracks whether we already showed the "drop while navigating" toast. */
  #dropRejectionToastShown = false

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
    })
    this.defaultLocale = {
      strings: { ...this.defaultLocale?.strings, ...locale.strings },
    }
    this.i18nInit()
    this.title = this.i18n('pluginNameTransloaditStorage')
    this.icon = () => <StorageIcon color="#0d8ceb" />
  }

  /**
   * Re-evaluates toolbar actions whenever the loading state changes so the
   * "Upload files" button appears or disappears as soon as navigation settles,
   * without waiting for a session event (which only fires on login/logout).
   */
  #onStateUpdate = (): void => {
    const loading = this.getPluginState().loading
    if (loading !== this.#lastLoading) {
      const wasLoading = Boolean(this.#lastLoading)
      this.#lastLoading = loading
      // Rebuild only the toolbar actions slice that we own.  S3's private
      // #applyActions cannot be called directly; we update view.opts ourselves
      // and then trigger a re-render with setPluginState.
      this.view.opts.toolbarActions = [
        ...this.builtInToolbarActions(),
        ...(this.opts.toolbarActions ?? []),
      ]
      this.setPluginState({})
      // Reset the drop-rejection toast flag when navigation settles, so the
      // next pending navigation can show it again.
      if (wasLoading && !loading) this.#dropRejectionToastShown = false
    }
  }

  /**
   * With `storeUploads`, files dropped on the panel are stored in the folder
   * that is open, which only a session that can write may do. Without it they
   * join the Dashboard's uploads, as with `@uppy/s3`.
   *
   * @experimental `@uppy/transloadit-storage` is experimental: its options,
   * behaviour and Companion endpoints will change incompatibly, also in
   * minor releases.
   */
  override get acceptsFileDrops(): boolean {
    // Drop admission requires a resolved folder: never accept while a listing
    // is in flight, otherwise the dropped files would target the old folder.
    const navigating = Boolean(this.getPluginState().loading)
    if (
      navigating &&
      this.opts.storeUploads &&
      !this.#dropRejectionToastShown
    ) {
      // Show the toast once per pending navigation so the user knows why the
      // drop cursor changed.
      this.#dropRejectionToastShown = true
      this.uppy.info(this.i18n('dropWhileNavigating'), 'warning', 4000)
    }
    return (
      this.opts.mode !== 'manager' &&
      !navigating &&
      (this.opts.storeUploads == null || this.canWrite)
    )
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
    // Uploads land in the open folder: only a session that may write, and only
    // when the folder listing has settled so the destination is unambiguous.
    if (
      (!storeUploads && !onUploadRequest) ||
      !this.canWrite ||
      this.getPluginState().loading
    )
      return actions
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
    // Capture the destination before the async file picker, so navigating
    // while the picker dialog is open does not change the target.
    this.#pinDestination()
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

  /**
   * Capture the destination prefix once, at the moment files are first
   * accepted.  Every subsequent signing request in this batch uses the
   * pinned value instead of reading the (potentially changed) current folder.
   */
  #pinDestination(): void {
    if (this.#pinnedDestination === null) {
      this.#pinnedDestination = openFolderKey(this)
    }
  }

  /** Provides the pinned (or current) destination to the signing closure. */
  #getDestination = (): string => {
    return this.#pinnedDestination ?? openFolderKey(this)
  }

  /**
   * Pin the destination for any files added from this plugin (dropped or
   * picked).  Called once via the `file-added` event — one pin per batch.
   */
  #onFileAdded = (file: { source?: string | null }): void => {
    if (
      this.opts.storeUploads &&
      file.source === this.id &&
      this.#pinnedDestination === null
    ) {
      this.#pinDestination()
    }
  }

  /** Clear the pinned destination when the queue is empty or complete. */
  #onClearDestination = (): void => {
    if (this.uppy.getFiles().length === 0) {
      this.#pinnedDestination = null
    }
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
          getDestination: this.#getDestination,
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
    // Re-evaluate actions when loading changes so the "Upload files" button
    // disappears while navigation is in flight and reappears when it settles.
    this.uppy.on('state-update', this.#onStateUpdate)
    // Pin the destination for dropped/picked files.
    this.uppy.on('file-added', this.#onFileAdded)
    // Clear the pin when the queue empties.
    this.uppy.on('file-removed', this.#onClearDestination)
    this.uppy.on('cancel-all', this.#onClearDestination)
  }

  override uninstall(): void {
    this.uppy.off('cancel-all', this.#onClearDestination)
    this.uppy.off('file-removed', this.#onClearDestination)
    this.uppy.off('file-added', this.#onFileAdded)
    this.uppy.off('state-update', this.#onStateUpdate)
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
    // Clear the pinned destination regardless of outcome: the batch is done.
    this.#pinnedDestination = null
    if (result.failed?.length) return
    setTimeout(() => {
      try {
        this.uppy.clear()
      } catch {
        // Some uploaders refuse to clear mid-flight; the refresh matters more.
      }
      // A headless manager has no panel to return to.
      if (this.opts.mode !== 'manager') {
        const dashboard = this.uppy.getPlugin('Dashboard') as
          | { showPanel?: (id: string) => void }
          | undefined
        dashboard?.showPanel?.(this.id)
      }
      this.view.refreshCurrentFolder()
    }, 0)
  }
}

declare module '@uppy/core' {
  export interface PluginTypeRegistry<M extends Meta, B extends Body> {
    TransloaditStorage: TransloaditStorage<M, B>
  }
}
