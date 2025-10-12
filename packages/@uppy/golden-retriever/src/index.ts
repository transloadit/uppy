import type {
  Body,
  DefinePluginOpts,
  Meta,
  PluginOpts,
  State,
  UploadResult,
  Uppy,
  UppyFile,
} from '@uppy/core'
import { BasePlugin } from '@uppy/core'
import packageJson from '../package.json' with { type: 'json' }
import IndexedDBStore from './IndexedDBStore.js'
import MetaDataStore from './MetaDataStore.js'
import ServiceWorkerStore from './ServiceWorkerStore.js'

declare module '@uppy/core' {
  // biome-ignore lint/correctness/noUnusedVariables: must be defined
  export interface UppyEventMap<M extends Meta, B extends Body> {
    'restore:plugin-data-changed': (data: Record<string, unknown>) => void
  }
}

export interface GoldenRetrieverOptions extends PluginOpts {
  expires?: number
  serviceWorker?: boolean
  indexedDB?: {
    name?: string
    version?: number
  }
}

const defaultOptions = {
  expires: 24 * 60 * 60 * 1000, // 24 hours
  serviceWorker: false,
}

type Opts = DefinePluginOpts<
  GoldenRetrieverOptions,
  keyof typeof defaultOptions
>

/**
 * The GoldenRetriever plugin — restores selected files and resumes uploads
 * after a closed tab or a browser crash!
 *
 * Uses localStorage, IndexedDB and ServiceWorker to do its magic, read more:
 * https://uppy.io/blog/2017/07/golden-retriever/
 */
export default class GoldenRetriever<
  M extends Meta,
  B extends Body,
> extends BasePlugin<Opts, M, B> {
  static VERSION = packageJson.version

  #metaDataStore: MetaDataStore<M, B>

  #serviceWorkerStore: ServiceWorkerStore<M, B> | null

  #indexedDBStore: IndexedDBStore

  constructor(uppy: Uppy<M, B>, opts?: GoldenRetrieverOptions) {
    super(uppy, { ...defaultOptions, ...opts })
    this.type = 'debugger'
    this.id = this.opts.id || 'GoldenRetriever'

    this.#metaDataStore = new MetaDataStore({
      expires: this.opts.expires,
      storeName: uppy.getID(),
    })
    this.#serviceWorkerStore = null
    if (this.opts.serviceWorker) {
      this.#serviceWorkerStore = new ServiceWorkerStore({
        storeName: uppy.getID(),
      })
    }
    this.#indexedDBStore = new IndexedDBStore({
      expires: this.opts.expires,
      ...(this.opts.indexedDB || {}),
      storeName: uppy.getID(),
    })
  }

  async #restore() {
    const recoveredState = this.#metaDataStore.load()
    if (!recoveredState) {
      return
    }

    const currentUploads = recoveredState.currentUploads || {}
    const files = recoveredState.files || {}
    this.uppy.log(
      `[GoldenRetriever] Recovered ${Object.keys(currentUploads).length} current uploads and ${Object.keys(files).length} files from Local Storage`,
    )

    if (Object.keys(recoveredState.files).length <= 0) {
      this.uppy.log(
        '[GoldenRetriever] No files need to be loaded, restored only processing state...',
      )
      return
    }

    const [serviceWorkerBlobs, indexedDbBlobs] = await Promise.all([
      this.#loadFileBlobsFromServiceWorker(),
      this.#loadFileBlobsFromIndexedDB(),
    ])
    const blobs = {
      ...serviceWorkerBlobs,
      ...indexedDbBlobs,
    }

    // Loop through blobs that we can restore, add blobs to file objects
    const filesWithBlobs = Object.fromEntries(
      Object.entries(files).map(([fileID, file]) => {
        if (file.isRemote) {
          return [
            fileID,
            {
              ...file,
              isRestored: true,
              data: { size: null }, // todo shouldn't we save/restore the size too?
            },
          ]
        }

        const blob = blobs[fileID]
        return [
          fileID,
          {
            ...file,
            isRestored: true,
            data: blob,
            isGhost: !file.progress.uploadComplete && blob == null, // if we don’t have the blob (and the file is not completed uploading), mark the file as a ghost
          },
        ]
      }),
    )

    this.uppy.setState({
      recoveredState,
      currentUploads,
      files: filesWithBlobs,
    })

    this.uppy.emit('restored', recoveredState.pluginData) // must adhere to PersistentState interface in Transloadit

    const obsoleteBlobs = Object.keys(blobs).filter((fileID) => !files[fileID])

    if (obsoleteBlobs.length) {
      try {
        this.uppy.log(
          `[GoldenRetriever] Cleaning up ${obsoleteBlobs.length} old files`,
        )
        await this.#deleteBlobs(obsoleteBlobs)
      } catch (err) {
        this.uppy.log(
          `[GoldenRetriever] Could not clean up ${obsoleteBlobs.length} old files`,
          'warning',
        )
        this.uppy.log(err)
      }
    }
  }

  #patchMetadata = ({
    pluginData,
    ...patch
  }: Partial<NonNullable<ReturnType<MetaDataStore<M, B>['load']>>>): void => {
    const existing = this.#metaDataStore.load()
    this.#metaDataStore.save({
      ...(existing ?? {
        currentUploads: {},
        files: {},
      }),
      ...patch,
      pluginData: {
        // pluginData is keyed by plugin id, so we merge instead of replace
        ...existing?.pluginData,
        ...pluginData,
      },
    })
  }

  async #loadFileBlobsFromServiceWorker(): Promise<Record<string, Blob>> {
    if (!this.#serviceWorkerStore) {
      return {}
    }

    try {
      const blobs = await this.#serviceWorkerStore.list()
      const numberOfFilesRecovered = Object.keys(blobs).length

      this.uppy.log(
        numberOfFilesRecovered > 0
          ? `[GoldenRetriever] Successfully recovered ${numberOfFilesRecovered} blobs from Service Worker!`
          : '[GoldenRetriever] No blobs found in Service Worker',
      )
      return blobs
    } catch (err) {
      this.uppy.log(
        '[GoldenRetriever] Failed to recover blobs from Service Worker',
        'warning',
      )
      this.uppy.log(err)
      return {}
    }
  }

  async #loadFileBlobsFromIndexedDB(): ReturnType<IndexedDBStore['list']> {
    try {
      const blobs = await this.#indexedDBStore.list()
      const numberOfFilesRecovered = Object.keys(blobs).length

      this.uppy.log(
        numberOfFilesRecovered > 0
          ? `[GoldenRetriever] Successfully recovered ${numberOfFilesRecovered} blobs from IndexedDB!`
          : '[GoldenRetriever] No blobs found in IndexedDB',
      )
      return blobs
    } catch (err) {
      this.uppy.log(
        '[GoldenRetriever] Failed to recover blobs from IndexedDB',
        'warning',
      )
      this.uppy.log(err)
      return {}
    }
  }

  async #deleteBlobs(fileIDs: string[]) {
    await Promise.all(
      fileIDs.map((id) =>
        Promise.all([
          this.#serviceWorkerStore?.delete(id),
          this.#indexedDBStore.delete(id),
        ]),
      ),
    )
    this.uppy.log(`[GoldenRetriever] Removed ${fileIDs.length} blobs`)
  }

  async [Symbol.for('uppy test: deleteBlobs')](fileIDs: string[]) {
    return this.#deleteBlobs(fileIDs)
  }

  #addBlobToStores = async (file: UppyFile<M, B>) => {
    if (file.isRemote) return

    await Promise.all([
      this.#serviceWorkerStore?.put(file).catch((err) => {
        this.uppy.log(
          '[GoldenRetriever] Could not store file in Service Worker',
          'warning',
        )
        this.uppy.log(err)
      }),
      this.#indexedDBStore.put(file).catch((err) => {
        this.uppy.log(
          '[GoldenRetriever] Could not store file in IndexedDB',
          'warning',
        )
        this.uppy.log(err)
      }),
    ])
  }

  #handleStateUpdate = (
    prevState: State<M, B>,
    nextState: State<M, B>,
    patch: Partial<State<M, B>> | undefined,
  ) => {
    if (nextState.currentUploads !== prevState.currentUploads) {
      const { currentUploads } = this.uppy.getState()
      this.#patchMetadata({ currentUploads })
    }
    if (nextState.files !== prevState.files) {
      const files = nextState.files

      // We dont’t want to store file.data on local files, because the actual blob will be restored later,
      // and we want to avoid having weird properties in the serialized object (like file.preview).
      const filesWithoutBlobs = Object.fromEntries(
        Object.entries(files).map(
          ([fileID, { data, preview, ...fileInfo }]) => [fileID, fileInfo],
        ),
      )

      this.#patchMetadata({ files: filesWithoutBlobs })
    }
    // todo handle also blob changes here. currently we don't handle all blob changes, for example compressed image
  }

  #handleFileAdded = async (file: UppyFile<M, B>) => {
    try {
      await this.#addBlobToStores(file)
    } catch (err) {
      this.uppy.log(
        `[GoldenRetriever] Failed to store file ${file.id}`,
        'warning',
      )
      this.uppy.log(err)
    }
  }

  #handleFileRemoved = async (file: UppyFile<M, B>) => {
    try {
      await this.#deleteBlobs([file.id])
      const remainingFiles = Object.keys(this.uppy.getState().files)
      if (remainingFiles.length === 0) {
        this.uppy.setState({ recoveredState: null })
        MetaDataStore.cleanup(this.uppy.opts.id)
      }
    } catch (err) {
      this.uppy.log(
        `[GoldenRetriever] Failed to remove file ${file.id}`,
        'warning',
      )
      this.uppy.log(err)
    }
  }

  #handleFileUploaded = async (file: UppyFile<M, B> | undefined) => {
    if (file == null) {
      return
    }
    try {
      await this.#deleteBlobs([file.id])
    } catch (err) {
      this.uppy.log(
        `[GoldenRetriever] Failed to remove file ${file.id}`,
        'warning',
      )
      this.uppy.log(err)
    }
  }

  #replaceBlobInStores = async (file: UppyFile<M, B>) => {
    await this.#deleteBlobs([file.id])
    await this.#addBlobToStores(file)
  }

  #handleRestoreConfirmed = (): void => {
    this.uppy.log('[GoldenRetriever] Restore confirmed, proceeding...')
    // start all uploads again when file blobs are restored
    const { currentUploads } = this.uppy.getState()
    if (Object.keys(currentUploads).length > 0) {
      this.uppy.resumeAll()
      Object.keys(currentUploads).forEach((uploadId) => {
        this.uppy.restore(uploadId)
      })
    } else {
      // if there are no current uploads, but there were files added just start a new upload with the current files
      this.uppy.upload()
    }
    this.uppy.setState({ recoveredState: null })
  }

  #handleUploadComplete = async ({
    successful,
    failed,
  }: UploadResult<M, B>) => {
    // In all cases, remove the blobs of the *successfully* uploaded because we don't need them anymore.
    const fileIDs = successful!.map((file) => file.id)
    try {
      await this.#deleteBlobs(fileIDs)
    } catch (err) {
      this.uppy.log(
        `[GoldenRetriever] Could not remove ${successful!.length} files that finished uploading`,
        'warning',
      )
      this.uppy.log(err)
    }

    // Then, only if there were *no* failed files (meaning only successful), remove the stored restoration state.
    // This makes sure that if the upload was only partially successful, the user can still restore the remaining files.
    // https://github.com/transloadit/uppy/issues/5927
    // Note that we cannot just check all files in #saveFilesStateToLocalStorage and clear if all files have progress.uploadComplete
    // because uploadComplete only means that the upload was completed, but there may be post-processing steps that are not done yet, like Transloadit assembly.
    // This has the side effect that if 'complete' is never emitted (for example if the user removes all uploads manually), the recovery state is not cleared.
    // Not sure how to fix this.
    if (failed != null && failed.length === 0) {
      this.uppy.setState({ recoveredState: null })
      this.uppy.log(
        `[GoldenRetriever] All files have been uploaded successfully, clearing recovery state`,
      )
      MetaDataStore.cleanup(this.uppy.opts.id)
    }
  }

  #handlePluginDataChanged = (data: Record<string, unknown>): void => {
    this.#patchMetadata({ pluginData: data })
  }

  install(): void {
    this.#restore()

    this.uppy.on('file-added', this.#handleFileAdded)
    // @ts-expect-error this is typed in @uppy/image-editor and we can't access those types.
    this.uppy.on('file-editor:complete', this.#replaceBlobInStores)
    this.uppy.on('file-removed', this.#handleFileRemoved)
    this.uppy.on('upload-success', this.#handleFileUploaded)
    this.uppy.on('state-update', this.#handleStateUpdate)
    this.uppy.on('restore-confirmed', this.#handleRestoreConfirmed)
    this.uppy.on('complete', this.#handleUploadComplete)
    this.uppy.on('restore:plugin-data-changed', this.#handlePluginDataChanged)
  }

  uninstall(): void {
    this.uppy.off('file-added', this.#addBlobToStores)
    // @ts-expect-error this is typed in @uppy/image-editor and we can't access those types.
    this.uppy.off('file-editor:complete', this.#replaceBlobInStores)
    this.uppy.off('file-removed', this.#handleFileRemoved)
    this.uppy.off('upload-success', this.#handleFileUploaded)
    this.uppy.off('state-update', this.#handleStateUpdate)
    this.uppy.off('restore-confirmed', this.#handleRestoreConfirmed)
    this.uppy.off('complete', this.#handleUploadComplete)
    this.uppy.off('restore:plugin-data-changed', this.#handlePluginDataChanged)
  }
}

export { default as MetaDataStore } from './MetaDataStore.js'
