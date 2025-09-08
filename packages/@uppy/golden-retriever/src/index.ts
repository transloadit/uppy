import type {
  Body,
  DefinePluginOpts,
  Meta,
  PluginOpts,
  UploadResult,
  Uppy,
  UppyFile,
} from '@uppy/core'
import { BasePlugin } from '@uppy/core'
import throttle from 'lodash/throttle.js'
import packageJson from '../package.json' with { type: 'json' }
import IndexedDBStore from './IndexedDBStore.js'
import MetaDataStore from './MetaDataStore.js'
import ServiceWorkerStore from './ServiceWorkerStore.js'

declare module '@uppy/core' {
  // biome-ignore lint/correctness/noUnusedVariables: must be defined
  export interface UppyEventMap<M extends Meta, B extends Body> {
    // TODO: remove this event
    'restore:get-data': (fn: (data: Record<string, unknown>) => void) => void
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

  #savedPluginData?: Record<string, unknown>

  #saveFilesStateToLocalStorageThrottled: () => void

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

    this.#saveFilesStateToLocalStorageThrottled = throttle(
      this.#saveFilesStateToLocalStorage,
      500,
      { leading: true, trailing: true },
    )
  }

  #restoreState(): void {
    const savedState = this.#metaDataStore.load()
    if (savedState) {
      this.uppy.log('[GoldenRetriever] Recovered some state from Local Storage')
      this.uppy.setState({
        currentUploads: savedState.currentUploads || {},
        files: savedState.files || {},
        recoveredState: savedState,
      })
      this.#savedPluginData = savedState.pluginData
    }
  }

  #saveFilesStateToLocalStorage = (): void => {
    // File objects that are currently waiting: they've been selected,
    // but aren't yet being uploaded.
    const waitingFiles = this.uppy
      .getFiles()
      .filter((file) => !file.progress || !file.progress.uploadStarted)

    // File objects that are currently being uploaded. If a file has finished
    // uploading, but the other files in the same batch have not, the finished
    // file is also returned.
    const uploadingFiles = Object.values(this.uppy.getState().currentUploads)
      .map((currentUpload) =>
        currentUpload.fileIDs.map((fileID) => {
          const file = this.uppy.getFile(fileID)
          return file != null ? [file] : [] // file might have been removed
        }),
      )
      .flat(2)

    const allFiles = [...waitingFiles, ...uploadingFiles]
    // unique by file.id
    const fileToSave = Object.values(
      Object.fromEntries(allFiles.map((file) => [file.id, file])),
    )

    // If all files have been removed by the user, clear recovery state
    if (fileToSave.length === 0) {
      if (this.uppy.getState().recoveredState !== null) {
        this.uppy.setState({ recoveredState: null })
      }
      MetaDataStore.cleanup(this.uppy.opts.id)
      return
    }

    // We dont’t need to store file.data on local files, because the actual blob will be restored later,
    // and we want to avoid having weird properties in the serialized object.
    // Also adding file.isRestored to all files, since they will be restored from local storage
    const filesToSaveWithoutData = Object.fromEntries(
      fileToSave.map((fileInfo) => [
        fileInfo.id,
        fileInfo.isRemote
          ? {
              ...fileInfo,
              isRestored: true,
            }
          : {
              ...fileInfo,
              isRestored: true,
              data: null,
              preview: null,
            },
      ]),
    )

    const pluginData = {}
    // TODO Remove this,
    // Other plugins can attach a restore:get-data listener that receives this callback.
    // Plugins can then use this callback (sync) to provide data to be stored.
    this.uppy.emit('restore:get-data', (data) => {
      Object.assign(pluginData, data)
    })

    const { currentUploads } = this.uppy.getState()

    this.#metaDataStore.save({
      currentUploads,
      files: filesToSaveWithoutData,
      pluginData,
    })
  }

  async #loadFileBlobsFromServiceWorker(): Promise<Record<string, Blob>> {
    if (!this.#serviceWorkerStore) {
      return {}
    }

    try {
      const blobs = await this.#serviceWorkerStore.list()
      const numberOfFilesRecovered = Object.keys(blobs).length

      if (numberOfFilesRecovered > 0) {
        this.uppy.log(
          `[GoldenRetriever] Successfully recovered ${numberOfFilesRecovered} blobs from Service Worker!`,
        )
        return blobs
      }
      this.uppy.log(
        '[GoldenRetriever] No blobs found in Service Worker, trying IndexedDB now...',
      )
      return {}
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

      if (numberOfFilesRecovered > 0) {
        this.uppy.log(
          `[GoldenRetriever] Successfully recovered ${numberOfFilesRecovered} blobs from IndexedDB!`,
        )
        return blobs
      }
      this.uppy.log('[GoldenRetriever] No blobs found in IndexedDB')
      return {}
    } catch (err) {
      this.uppy.log(
        '[GoldenRetriever] Failed to recover blobs from IndexedDB',
        'warning',
      )
      this.uppy.log(err)
      return {}
    }
  }

  async #onBlobsLoaded(blobs: Record<string, Blob>) {
    const obsoleteBlobs: string[] = []
    const updatedFiles = { ...this.uppy.getState().files }

    // Loop through blobs that we can restore, add blobs to file objects
    Object.keys(blobs).forEach((fileID) => {
      const originalFile = this.uppy.getFile(fileID)
      if (!originalFile) {
        obsoleteBlobs.push(fileID)
        return
      }

      const cachedData = blobs[fileID]

      const updatedFileData = {
        data: cachedData,
        isRestored: true,
        isGhost: false,
      }
      updatedFiles[fileID] = { ...originalFile, ...updatedFileData }
    })

    // Loop through files that we can’t restore fully — we only have meta, not blobs,
    // set .isGhost on them, also set isRestored to all files
    Object.keys(updatedFiles).forEach((fileID) => {
      if (updatedFiles[fileID].data === null) {
        updatedFiles[fileID] = {
          ...updatedFiles[fileID],
          isGhost: true,
        }
      }
    })

    this.uppy.setState({
      files: updatedFiles,
    })

    this.uppy.emit('restored', this.#savedPluginData)

    if (obsoleteBlobs.length) {
      try {
        await this.#deleteBlobs(obsoleteBlobs)
        this.uppy.log(
          `[GoldenRetriever] Cleaned up ${obsoleteBlobs.length} old files`,
        )
      } catch (err) {
        this.uppy.log(
          `[GoldenRetriever] Could not clean up ${obsoleteBlobs.length} old files`,
          'warning',
        )
        this.uppy.log(err)
      }
    }
  }

  async deleteBlobs(fileIDs: string[]): Promise<void> {
    await Promise.all(
      fileIDs.map(
        (id) =>
          this.#serviceWorkerStore?.delete(id) ??
          this.#indexedDBStore?.delete(id),
      ),
    )
  }

  #addBlobToStores = (file: UppyFile<M, B>): void => {
    if (file.isRemote) return

    if (this.#serviceWorkerStore) {
      this.#serviceWorkerStore.put(file).catch((err) => {
        this.uppy.log('[GoldenRetriever] Could not store file', 'warning')
        this.uppy.log(err)
      })
    }

    this.#indexedDBStore.put(file).catch((err) => {
      this.uppy.log('[GoldenRetriever] Could not store file', 'warning')
      this.uppy.log(err)
    })
  }

  #removeBlobFromStores = (file: UppyFile<M, B>): void => {
    if (this.#serviceWorkerStore) {
      this.#serviceWorkerStore.delete(file.id).catch((err) => {
        this.uppy.log('[GoldenRetriever] Failed to remove file', 'warning')
        this.uppy.log(err)
      })
    }
    this.#indexedDBStore.delete(file.id).catch((err) => {
      this.uppy.log('[GoldenRetriever] Failed to remove file', 'warning')
      this.uppy.log(err)
    })
  }

  #replaceBlobInStores = (file: UppyFile<M, B>): void => {
    this.#removeBlobFromStores(file)
    this.#addBlobToStores(file)
  }

  #handleRestoreConfirmed = (): void => {
    this.uppy.log('[GoldenRetriever] Restore confirmed, proceeding...')
    // start all uploads again when file blobs are restored
    const { currentUploads } = this.uppy.getState()
    if (currentUploads) {
      this.uppy.resumeAll()
      Object.keys(currentUploads).forEach((uploadId) => {
        this.uppy.restore(uploadId)
      })
    }
    this.uppy.setState({ recoveredState: null })
  }

  #abortRestore = async () => {
    this.uppy.log('[GoldenRetriever] Aborting restore...')

    this.uppy.cancelAll()
    this.uppy.setState({ recoveredState: null })
    MetaDataStore.cleanup(this.uppy.opts.id)

    const fileIDs = Object.keys(this.uppy.getState().files)
    try {
      await this.#deleteBlobs(fileIDs)
      this.uppy.log(`[GoldenRetriever] Removed ${fileIDs.length} files`)
    } catch (err) {
      this.uppy.log(
        `[GoldenRetriever] Could not remove ${fileIDs.length} files`,
        'warning',
      )
      this.uppy.log(err)
    }
  }

  #handleComplete = async ({ successful }: UploadResult<M, B>) => {
    this.uppy.setState({ recoveredState: null })
    MetaDataStore.cleanup(this.uppy.opts.id)

    const fileIDs = successful!.map((file) => file.id)
    try {
      await this.#deleteBlobs(fileIDs)
      this.uppy.log(
        `[GoldenRetriever] Removed ${successful!.length} files that finished uploading`,
      )
    } catch (err) {
      this.uppy.log(
        `[GoldenRetriever] Could not remove ${successful!.length} files that finished uploading`,
        'warning',
      )
      this.uppy.log(err)
    }
  }

  #restoreBlobs = async () => {
    if (this.uppy.getFiles().length <= 0) {
      this.uppy.log(
        '[GoldenRetriever] No files need to be loaded, only restoring processing state...',
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
    await this.#onBlobsLoaded(blobs)
  }

  install(): void {
    this.#restoreState()
    this.#restoreBlobs()

    this.uppy.on('file-added', this.#addBlobToStores)
    // @ts-expect-error this is typed in @uppy/image-editor and we can't access those types.
    this.uppy.on('file-editor:complete', this.#replaceBlobInStores)
    this.uppy.on('file-removed', this.#removeBlobFromStores)
    // TODO: the `state-update` is bad practise. It fires on any state change in Uppy
    // or any state change in any of the plugins. We should to able to only listen
    // for the state changes we need, somehow.
    this.uppy.on('state-update', this.#saveFilesStateToLocalStorageThrottled)
    this.uppy.on('restore-confirmed', this.#handleRestoreConfirmed)
    this.uppy.on('restore-canceled', this.#abortRestore)
    this.uppy.on('complete', this.#handleComplete)
  }

  uninstall(): void {
    this.uppy.off('file-added', this.#addBlobToStores)
    // @ts-expect-error this is typed in @uppy/image-editor and we can't access those types.
    this.uppy.off('file-editor:complete', this.#replaceBlobInStores)
    this.uppy.off('file-removed', this.#removeBlobFromStores)
    this.uppy.off('state-update', this.#saveFilesStateToLocalStorageThrottled)
    this.uppy.off('restore-confirmed', this.#handleRestoreConfirmed)
    this.uppy.off('restore-canceled', this.#abortRestore)
    this.uppy.off('complete', this.#handleComplete)
  }
}

export { default as MetaDataStore } from './MetaDataStore.js'
