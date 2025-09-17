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

  #handleStateUpdateThrottled: () => void

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

    this.#handleStateUpdateThrottled = throttle(
      this.#saveFilesStateToLocalStorage,
      500,
      { leading: true, trailing: true },
    )
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

    this.uppy.emit('restored', recoveredState.pluginData)

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

    // When all files have been removed by the user, clear recovery state
    if (fileToSave.length === 0) {
      this.uppy.setState({ recoveredState: null })
      MetaDataStore.cleanup(this.uppy.opts.id)
      return
    }

    // We dont’t need to store file.data on local files, because the actual blob will be restored later,
    // and we want to avoid having weird properties in the serialized object (like file.preview).
    const filesWithoutBlobs = Object.fromEntries(
      fileToSave.map(({ data, preview, ...fileInfo }) => [
        fileInfo.id,
        fileInfo,
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
      files: filesWithoutBlobs,
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

  #handleFileRemoved = async (file: UppyFile<M, B>) => {
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
    if (currentUploads) {
      this.uppy.resumeAll()
      Object.keys(currentUploads).forEach((uploadId) => {
        this.uppy.restore(uploadId)
      })
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

    // Then, only if there were *no* failed files, remove the stored restoration state.
    // This makes sure that if the upload was only partially successful, the user can still restore the remaining files.
    // https://github.com/transloadit/uppy/issues/5927
    if (failed == null || failed.length === 0) {
      this.uppy.setState({ recoveredState: null })
      this.uppy.log(
        `[GoldenRetriever] All files have been uploaded successfully, clearing recovery state`,
      )
      MetaDataStore.cleanup(this.uppy.opts.id)
    }
  }

  install(): void {
    this.#restore()

    this.uppy.on('file-added', this.#addBlobToStores)
    // @ts-expect-error this is typed in @uppy/image-editor and we can't access those types.
    this.uppy.on('file-editor:complete', this.#replaceBlobInStores)
    this.uppy.on('file-removed', this.#handleFileRemoved)
    this.uppy.on('upload-success', this.#handleFileUploaded)
    // TODO: the `state-update` is bad practise. It fires on any state change in Uppy
    // or any state change in any of the plugins. We should to able to only listen
    // for the state changes we need, somehow.
    this.uppy.on('state-update', this.#handleStateUpdateThrottled)
    this.uppy.on('restore-confirmed', this.#handleRestoreConfirmed)
    this.uppy.on('complete', this.#handleUploadComplete)
  }

  uninstall(): void {
    this.uppy.off('file-added', this.#addBlobToStores)
    // @ts-expect-error this is typed in @uppy/image-editor and we can't access those types.
    this.uppy.off('file-editor:complete', this.#replaceBlobInStores)
    this.uppy.off('file-removed', this.#handleFileRemoved)
    this.uppy.off('upload-success', this.#handleFileUploaded)
    this.uppy.off('state-update', this.#handleStateUpdateThrottled)
    this.uppy.off('restore-confirmed', this.#handleRestoreConfirmed)
    this.uppy.off('complete', this.#handleUploadComplete)
  }
}

export { default as MetaDataStore } from './MetaDataStore.js'
