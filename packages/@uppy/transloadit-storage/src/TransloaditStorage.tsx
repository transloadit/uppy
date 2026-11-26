import type { Body, Meta, UploadResult, Uppy, UppyFile } from '@uppy/core'
import type {
  ProviderAction,
  ProviderToolbarAction,
} from '@uppy/core/provider-views'
import type { LocaleStrings } from '@uppy/core/utils'
import type { S3Options } from '@uppy/s3'

import type { StoreUploadsOptions } from './storeAssemblyOptions.js'

import { UserFacingApiError } from '@uppy/core'
import S3, { StorageIcon } from '@uppy/s3'

import packageJson from '../package.json' with { type: 'json' }
import locale from './locale.js'
import {
  createStoreAssemblyOptions,
  hasStoreAssemblyOptions,
  openFolderKey,
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
   * Store uploads in the folder that was open in this panel when they were
   * added (see `uploadFolderKey`), through an
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
   * With `storeUploads` or `createStoreAssemblyOptions`, files dropped on the
   * panel are stored in the open folder, which only a session that can write
   * may do. Otherwise they join the Dashboard's uploads, as with `@uppy/s3`.
   *
   * @experimental `@uppy/transloadit-storage` is experimental: its options,
   * behaviour and Companion endpoints will change incompatibly, also in
   * minor releases.
   */
  override get acceptsFileDrops(): boolean {
    return (
      this.opts.mode !== 'manager' &&
      (!this.#storesUploads || (this.canWrite && this.#storesInOpenFolder()))
    )
  }

  /** The folder the queued files were added in; see `uploadFolderKey`. */
  #addedIn: string | undefined

  #bindAfterLoading = false

  #pendingFileAdds = 0

  #destinationGeneration = 0

  protected override onSessionChanged(): void {
    super.onSessionChanged()
    this.#destinationGeneration += 1
    this.#addedIn = undefined
    this.#bindAfterLoading = false
    this.#pendingFileAdds = 0
    this.#addReservation = undefined
  }

  #addReservation:
    | {
        addedIn: string | undefined
        bindAfterLoading: boolean
        committed: boolean
      }
    | undefined

  get #storesUploads(): boolean {
    return (
      this.opts.storeUploads != null ||
      hasStoreAssemblyOptions(this.uppy, this.id)
    )
  }

  get #uploadRoot(): string {
    const prefix = this.rootPrefix
    return prefix && !prefix.endsWith('/') ? `${prefix}/` : prefix
  }

  get #openUploadFolder(): string {
    const open = openFolderKey(this)
    return open.startsWith(this.#uploadRoot) ? open : this.#uploadRoot
  }

  #canAddHere(): boolean {
    if (this.isNavigating) {
      this.uppy.info(this.i18n('uploadFolderLoading'), 'info', 5000)
      return false
    }
    if (this.#storesUploads && this.uploadFolderKey !== openFolderKey(this)) {
      this.uppy.info(this.i18n('uploadQueuedElsewhere'), 'info', 5000)
      return false
    }
    return true
  }

  /** Reserves the destination before Dashboard can close and reset this panel. */
  override beginAddingFiles = (): (() => void) | false | undefined => {
    if (!this.#storesUploads) return
    if (!this.#canAddHere()) return false
    if (this.#pendingFileAdds === 0) {
      this.#addReservation = {
        addedIn: this.#addedIn,
        bindAfterLoading: this.#bindAfterLoading,
        committed: false,
      }
    }
    if (this.#addedIn === undefined || !this.#hasQueuedFiles()) {
      this.#addedIn = this.#openUploadFolder
      this.#bindAfterLoading = false
    }
    this.#pendingFileAdds += 1
    const generation = this.#destinationGeneration
    let finished = false
    return () => {
      if (finished) return
      finished = true
      if (generation !== this.#destinationGeneration) return
      this.#pendingFileAdds -= 1
      const reservation = this.#addReservation
      if (this.#pendingFileAdds !== 0 || !reservation) return
      this.#addReservation = undefined
      if (!reservation.committed) {
        this.#addedIn = reservation.addedIn
        this.#bindAfterLoading = reservation.bindAfterLoading
        this.#settleQueuedFolder()
      }
    }
  }

  /**
   * The storage key prefix uploads are stored under: the folder that was open
   * when the first of the queued files was added, so navigating meanwhile (or
   * reopening the panel elsewhere) does not move them. With nothing queued,
   * the open folder.
   *
   * @experimental `@uppy/transloadit-storage` is experimental: its options,
   * behaviour and Companion endpoints will change incompatibly, also in
   * minor releases.
   */
  get uploadFolderKey(): string {
    const queued = this.#hasQueuedFiles()
    return queued &&
      this.#addedIn !== undefined &&
      this.#addedIn.startsWith(this.#uploadRoot)
      ? this.#addedIn
      : this.#openUploadFolder
  }

  /** Commits an unbound queue's destination before its Assembly is signed. */
  reserveUploadFolder(): string {
    if (
      this.#addedIn !== undefined &&
      !this.#addedIn.startsWith(this.#uploadRoot)
    ) {
      this.onSessionChanged()
    }
    this.#settleQueuedFolder()
    if (
      this.#hasQueuedFiles() &&
      this.#addedIn === undefined &&
      (this.getPluginState().loading || this.isNavigating)
    ) {
      this.#bindAfterLoading = true
    }
    if (this.#bindAfterLoading) {
      throw new UserFacingApiError(this.i18n('uploadFolderLoading'))
    }
    if (this.#hasQueuedFiles() && this.#addedIn === undefined) {
      this.#addedIn = this.#openUploadFolder
    }
    if (this.#addReservation) this.#addReservation.committed = true
    return this.uploadFolderKey
  }

  #settleQueuedFolder = (): void => {
    if (
      !this.#bindAfterLoading ||
      this.getPluginState().loading ||
      this.isNavigating
    )
      return
    this.#bindAfterLoading = false
    if (this.getPluginState().authenticated && this.#hasQueuedFiles()) {
      this.#addedIn = this.#openUploadFolder
    }
  }

  /** Failed processing and active retries still own their destination after transport completes. */
  #hasQueuedFiles(excludedIds?: ReadonlySet<string>): boolean {
    if (this.#pendingFileAdds > 0) return true
    const activeFiles = new Set(
      Object.values(this.uppy.getState().currentUploads).flatMap(
        ({ fileIDs }) => fileIDs,
      ),
    )
    return this.uppy
      .getFiles()
      .some(
        (file) =>
          !excludedIds?.has(file.id) &&
          (!file.progress.uploadComplete ||
            file.error != null ||
            activeFiles.has(file.id)),
      )
  }

  /**
   * Whether files added now would be stored in the folder the panel shows:
   * not while the next folder is still listing (`currentFolderId` is still
   * the previous one), nor while files queued in another folder wait.
   */
  #storesInOpenFolder(): boolean {
    return (
      !this.getPluginState().loading &&
      !this.isNavigating &&
      this.uploadFolderKey === openFolderKey(this)
    )
  }

  /** A new queue is stored in the folder open when its first files arrive. */
  #onFilesAdded = (files: UppyFile<M, B>[]): void => {
    if (files.length === 0) return
    if (this.#addReservation) {
      this.#addReservation.committed = true
    }
    const added = new Set(files.map((file) => file.id))
    if (this.#hasQueuedFiles(added) && this.#addedIn !== undefined) return
    // Widget additions reserve their folder before emitting files-added;
    // external additions must wait for navigation to settle.
    const { authenticated, loading } = this.getPluginState()
    this.#bindAfterLoading = this.isNavigating || Boolean(loading)
    // Before connecting, the first Assembly reserves the now-known root.
    this.#addedIn =
      authenticated && !this.#bindAfterLoading
        ? this.#openUploadFolder
        : undefined
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
    // Uploads land in the open folder: only a session that may write.
    if ((!storeUploads && !onUploadRequest) || !this.canWrite) return actions
    return [
      {
        id: 'transloadit:uploadFiles',
        label: this.i18n('uploadFiles'),
        refresh: false,
        // The host app can take over (e.g. a full Dashboard modal with remote
        // sources); otherwise a plain file picker owned by the widget. Either
        // way files go into the folder that is open (storeUploads builds the
        // Assembly params). The view does not run it while a folder lists.
        run: () => {
          if (this.isNavigating || this.getPluginState().loading) {
            this.uppy.info(this.i18n('uploadFolderLoading'), 'info', 5000)
          } else if (this.#storesUploads && !this.#storesInOpenFolder()) {
            this.uppy.info(this.i18n('uploadQueuedElsewhere'), 'info', 5000)
          } else if (onUploadRequest) {
            onUploadRequest({ prefix: openFolderKey(this) })
          } else {
            this.#pickFiles()
          }
        },
      },
      ...actions,
    ]
  }

  /** Lets the user pick local files and adds them to Uppy. */
  #pickFiles(): void {
    if (!this.#canAddHere()) return
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.style.display = 'none'
    input.addEventListener('change', () => {
      const finishSelection = this.beginAddingFiles()
      if (finishSelection === false) {
        input.remove()
        return
      }
      try {
        this.uppy.addFiles(
          Array.from(input.files ?? [], (file) => ({
            name: file.name,
            type: file.type,
            data: file,
            source: this.id,
            isRemote: false,
          })),
        )
      } finally {
        finishSelection?.()
        input.remove()
      }
    })
    input.addEventListener('cancel', () => {
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
    this.uppy.on('files-added', this.#onFilesAdded)
    this.uppy.on('state-update', this.#settleQueuedFolder)
    if (reopenAfterUpload) this.uppy.on('complete', this.#reopenAfterUpload)
  }

  override uninstall(): void {
    this.uppy.off('complete', this.#reopenAfterUpload)
    this.uppy.off('files-added', this.#onFilesAdded)
    this.uppy.off('state-update', this.#settleQueuedFolder)
    super.uninstall()
  }

  /**
   * `complete` fires once every uploader, including @uppy/transloadit's
   * post-processing (waitForEncoding), has finished — so the stored files
   * exist by now. Clearing on the next macrotask lets the other `complete`
   * listeners (Dashboard's own success state) run on the final result first.
   */
  #canReopenAfterUpload(result: UploadResult<M, B>): boolean {
    if (result.failed?.length || !result.successful?.length) return false
    // The completing batch is still active while complete handlers run.
    const successful = new Set(
      result.successful.flatMap(({ id }) => {
        const file = this.uppy.getFile(id)
        return file?.progress.uploadComplete && file.error == null ? [id] : []
      }),
    )
    return !this.#hasQueuedFiles(successful)
  }

  #reopenAfterUpload = (result: UploadResult<M, B>): void => {
    if (!this.#canReopenAfterUpload(result)) return
    const destination = this.#addedIn ?? this.#openUploadFolder
    const destinationId =
      destination === this.#uploadRoot
        ? this.rootFolderId
        : encodeURIComponent(destination)
    setTimeout(() => {
      if (!this.#canReopenAfterUpload(result)) return
      const { partialTree } = this.getPluginState()
      if (partialTree == null) return
      // Relist the uploaded folder when opened again, preserving selections
      // in other cached folders while the panel refreshes its current view.
      this.setPluginState({
        partialTree: partialTree.map((node) =>
          node.type !== 'file' && node.id === destinationId
            ? { ...node, cached: false, nextPagePath: null }
            : node,
        ),
      })
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
