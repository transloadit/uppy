import throttle from 'lodash/throttle.js'
import BasePlugin from '@uppy/core/lib/BasePlugin.js'
import type { PluginOpts, DefinePluginOpts } from '@uppy/core/lib/BasePlugin.ts'
import type { Body, Meta, UppyFile } from '@uppy/utils/lib/UppyFile'
import type Uppy from '@uppy/core'
import type { UploadResult } from '@uppy/core'
import ServiceWorkerStore, {
  type ServiceWorkerStoredFile,
} from './ServiceWorkerStore.ts'
import IndexedDBStore from './IndexedDBStore.ts'
import MetaDataStore from './MetaDataStore.ts'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../package.json'

declare module '@uppy/core' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  MetaDataStore: MetaDataStore<M, B>

  ServiceWorkerStore: ServiceWorkerStore<M, B> | null

  IndexedDBStore: IndexedDBStore

  savedPluginData: Record<string, unknown>

  constructor(uppy: Uppy<M, B>, opts?: GoldenRetrieverOptions) {
    super(uppy, { ...defaultOptions, ...opts })
    this.type = 'debugger'
    this.id = this.opts.id || 'GoldenRetriever'

    this.MetaDataStore = new MetaDataStore({
      expires: this.opts.expires,
      storeName: uppy.getID(),
    })
    this.ServiceWorkerStore = null
    if (this.opts.serviceWorker) {
      this.ServiceWorkerStore = new ServiceWorkerStore({
        storeName: uppy.getID(),
      })
    }
    this.IndexedDBStore = new IndexedDBStore({
      expires: this.opts.expires,
      ...(this.opts.indexedDB || {}),
      storeName: uppy.getID(),
    })

    this.saveFilesStateToLocalStorage = throttle(
      this.saveFilesStateToLocalStorage.bind(this),
      500,
      { leading: true, trailing: true },
    )
    this.restoreState = this.restoreState.bind(this)
    this.loadFileBlobsFromServiceWorker =
      this.loadFileBlobsFromServiceWorker.bind(this)
    this.loadFileBlobsFromIndexedDB = this.loadFileBlobsFromIndexedDB.bind(this)
    this.onBlobsLoaded = this.onBlobsLoaded.bind(this)
  }

  restoreState(): void {
    const savedState = this.MetaDataStore.load()
    if (savedState) {
      this.uppy.log('[GoldenRetriever] Recovered some state from Local Storage')
      this.uppy.setState({
        currentUploads: savedState.currentUploads || {},
        files: savedState.files || {},
        recoveredState: savedState,
      })
      this.savedPluginData = savedState.pluginData
    }
  }

  /**
   * Get file objects that are currently waiting: they've been selected,
   * but aren't yet being uploaded.
   */
  getWaitingFiles(): Record<string, UppyFile<M, B>> {
    const waitingFiles: Record<string, UppyFile<M, B>> = {}

    this.uppy.getFiles().forEach((file) => {
      if (!file.progress || !file.progress.uploadStarted) {
        waitingFiles[file.id] = file
      }
    })

    return waitingFiles
  }

  /**
   * Get file objects that are currently being uploaded. If a file has finished
   * uploading, but the other files in the same batch have not, the finished
   * file is also returned.
   */
  getUploadingFiles(): Record<string, UppyFile<M, B>> {
    const uploadingFiles: Record<string, UppyFile<M, B>> = {}

    const { currentUploads } = this.uppy.getState()
    if (currentUploads) {
      const uploadIDs = Object.keys(currentUploads)
      uploadIDs.forEach((uploadID) => {
        const filesInUpload = currentUploads[uploadID].fileIDs
        filesInUpload.forEach((fileID) => {
          uploadingFiles[fileID] = this.uppy.getFile(fileID)
        })
      })
    }

    return uploadingFiles
  }

  saveFilesStateToLocalStorage(): void {
    const filesToSave = {
      ...this.getWaitingFiles(),
      ...this.getUploadingFiles(),
    }
    const fileToSaveEntries = Object.entries(filesToSave)

    // If all files have been removed by the user, clear recovery state
    if (fileToSaveEntries.length === 0) {
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
      fileToSaveEntries.map(([id, fileInfo]) => [
        id,
        fileInfo.isRemote ?
          {
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

    this.MetaDataStore.save({
      currentUploads,
      files: filesToSaveWithoutData,
      pluginData,
    })
  }

  loadFileBlobsFromServiceWorker(): Promise<
    ServiceWorkerStoredFile<M, B> | Record<string, unknown>
  > {
    if (!this.ServiceWorkerStore) {
      return Promise.resolve({})
    }

    return this.ServiceWorkerStore.list()
      .then((blobs) => {
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
      })
      .catch((err) => {
        this.uppy.log(
          '[GoldenRetriever] Failed to recover blobs from Service Worker',
          'warning',
        )
        this.uppy.log(err)
        return {}
      })
  }

  loadFileBlobsFromIndexedDB(): ReturnType<IndexedDBStore['list']> {
    return this.IndexedDBStore.list()
      .then((blobs) => {
        const numberOfFilesRecovered = Object.keys(blobs).length

        if (numberOfFilesRecovered > 0) {
          this.uppy.log(
            `[GoldenRetriever] Successfully recovered ${numberOfFilesRecovered} blobs from IndexedDB!`,
          )
          return blobs
        }
        this.uppy.log('[GoldenRetriever] No blobs found in IndexedDB')
        return {}
      })
      .catch((err) => {
        this.uppy.log(
          '[GoldenRetriever] Failed to recover blobs from IndexedDB',
          'warning',
        )
        this.uppy.log(err)
        return {}
      })
  }

  onBlobsLoaded(blobs: Record<string, Blob>): void {
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

    this.uppy.emit('restored', this.savedPluginData)

    if (obsoleteBlobs.length) {
      this.deleteBlobs(obsoleteBlobs)
        .then(() => {
          this.uppy.log(
            `[GoldenRetriever] Cleaned up ${obsoleteBlobs.length} old files`,
          )
        })
        .catch((err) => {
          this.uppy.log(
            `[GoldenRetriever] Could not clean up ${obsoleteBlobs.length} old files`,
            'warning',
          )
          this.uppy.log(err)
        })
    }
  }

  async deleteBlobs(fileIDs: string[]): Promise<void> {
    await Promise.all(
      fileIDs.map(
        (id) =>
          this.ServiceWorkerStore?.delete(id) ??
          this.IndexedDBStore?.delete(id),
      ),
    )
  }

  addBlobToStores = (file: UppyFile<M, B>): void => {
    if (file.isRemote) return

    if (this.ServiceWorkerStore) {
      this.ServiceWorkerStore.put(file).catch((err) => {
        this.uppy.log('[GoldenRetriever] Could not store file', 'warning')
        this.uppy.log(err)
      })
    }

    this.IndexedDBStore.put(file).catch((err) => {
      this.uppy.log('[GoldenRetriever] Could not store file', 'warning')
      this.uppy.log(err)
    })
  }

  removeBlobFromStores = (file: UppyFile<M, B>): void => {
    if (this.ServiceWorkerStore) {
      this.ServiceWorkerStore.delete(file.id).catch((err) => {
        this.uppy.log('[GoldenRetriever] Failed to remove file', 'warning')
        this.uppy.log(err)
      })
    }
    this.IndexedDBStore.delete(file.id).catch((err) => {
      this.uppy.log('[GoldenRetriever] Failed to remove file', 'warning')
      this.uppy.log(err)
    })
  }

  replaceBlobInStores = (file: UppyFile<M, B>): void => {
    this.removeBlobFromStores(file)
    this.addBlobToStores(file)
  }

  handleRestoreConfirmed = (): void => {
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

  abortRestore = (): void => {
    this.uppy.log('[GoldenRetriever] Aborting restore...')

    const fileIDs = Object.keys(this.uppy.getState().files)
    this.deleteBlobs(fileIDs)
      .then(() => {
        this.uppy.log(`[GoldenRetriever] Removed ${fileIDs.length} files`)
      })
      .catch((err) => {
        this.uppy.log(
          `[GoldenRetriever] Could not remove ${fileIDs.length} files`,
          'warning',
        )
        this.uppy.log(err)
      })

    this.uppy.cancelAll()
    this.uppy.setState({ recoveredState: null })
    MetaDataStore.cleanup(this.uppy.opts.id)
  }

  handleComplete = ({ successful }: UploadResult<M, B>): void => {
    const fileIDs = successful!.map((file) => file.id)
    this.deleteBlobs(fileIDs)
      .then(() => {
        this.uppy.log(
          `[GoldenRetriever] Removed ${successful!.length} files that finished uploading`,
        )
      })
      .catch((err) => {
        this.uppy.log(
          `[GoldenRetriever] Could not remove ${successful!.length} files that finished uploading`,
          'warning',
        )
        this.uppy.log(err)
      })

    this.uppy.setState({ recoveredState: null })
    MetaDataStore.cleanup(this.uppy.opts.id)
  }

  restoreBlobs = (): void => {
    if (this.uppy.getFiles().length > 0) {
      Promise.all([
        this.loadFileBlobsFromServiceWorker(),
        this.loadFileBlobsFromIndexedDB(),
      ]).then((resultingArrayOfObjects) => {
        const blobs = {
          ...resultingArrayOfObjects[0],
          ...resultingArrayOfObjects[1],
        } as Record<string, Blob>
        this.onBlobsLoaded(blobs)
      })
    } else {
      this.uppy.log(
        '[GoldenRetriever] No files need to be loaded, only restoring processing state...',
      )
    }
  }

  install(): void {
    this.restoreState()
    this.restoreBlobs()

    this.uppy.on('file-added', this.addBlobToStores)
    // @ts-expect-error this is typed in @uppy/image-editor and we can't access those types.
    this.uppy.on('file-editor:complete', this.replaceBlobInStores)
    this.uppy.on('file-removed', this.removeBlobFromStores)
    // TODO: the `state-update` is bad practise. It fires on any state change in Uppy
    // or any state change in any of the plugins. We should to able to only listen
    // for the state changes we need, somehow.
    this.uppy.on('state-update', this.saveFilesStateToLocalStorage)
    this.uppy.on('restore-confirmed', this.handleRestoreConfirmed)
    this.uppy.on('restore-canceled', this.abortRestore)
    this.uppy.on('complete', this.handleComplete)
  }

  uninstall(): void {
    this.uppy.off('file-added', this.addBlobToStores)
    // @ts-expect-error this is typed in @uppy/image-editor and we can't access those types.
    this.uppy.off('file-editor:complete', this.replaceBlobInStores)
    this.uppy.off('file-removed', this.removeBlobFromStores)
    this.uppy.off('state-update', this.saveFilesStateToLocalStorage)
    this.uppy.off('restore-confirmed', this.handleRestoreConfirmed)
    this.uppy.off('restore-canceled', this.abortRestore)
    this.uppy.off('complete', this.handleComplete)
  }
}
