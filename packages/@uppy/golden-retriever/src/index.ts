import type {
  Body,
  DefinePluginOpts,
  Meta,
  PluginOpts,
  State,
  Uppy,
  UppyFile,
} from '@uppy/core'
import { BasePlugin } from '@uppy/core'
import type { UppyFileId } from '@uppy/utils'
import packageJson from '../package.json' with { type: 'json' }
import IndexedDBStore from './IndexedDBStore.js'
import MetaDataStore from './MetaDataStore.js'
import ServiceWorkerStore from './ServiceWorkerStore.js'

declare module '@uppy/core' {
  // biome-ignore lint/correctness/noUnusedVariables: must be defined
  export interface UppyEventMap<M extends Meta, B extends Body> {
    'restore:plugin-data-changed': (data: Record<string, unknown>) => void
  }
  export interface PluginTypeRegistry<M extends Meta, B extends Body> {
    GoldenRetriever: GoldenRetriever<M, B>
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

  #serviceWorkerStore: ServiceWorkerStore | undefined

  #indexedDBStore: IndexedDBStore

  // @ts-expect-error for tests
  static [Symbol.for('uppy test: throttleTime')]: number | undefined

  constructor(uppy: Uppy<M, B>, opts?: GoldenRetrieverOptions) {
    super(uppy, { ...defaultOptions, ...opts })
    this.type = 'debugger'
    this.id = this.opts.id || 'GoldenRetriever'

    this.#metaDataStore = new MetaDataStore({
      expires: this.opts.expires,
      storeName: uppy.getID(),
      throttleTime:
        // @ts-expect-error for tests
        GoldenRetriever[Symbol.for('uppy test: throttleTime')] ?? undefined,
    })
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

  async #restore(): Promise<void> {
    const recoveredState = this.#metaDataStore.load()
    if (!recoveredState) {
      return
    }

    const currentUploads = recoveredState.currentUploads || {}
    const recoveredFiles = Object.entries(recoveredState.files || {})

    // If *all* files have completed *successfully*, ignore the whole stored restoration state.
    // This makes sure that if the upload was only partially successful, the user can still restore and upload the remaining files.
    // Here are some scenarios we have to take into account:
    // todo (make unit/e2e tests for these scenarios)
    // - the user removes all uploads one by one (once all are removed, we should not restore anything after reloading page)
    // - the user uploads files with Transloadit plugin enabled, uploads complete successfully, and the user refreshes the page while the assembly is still running. golden retriever should then restore the files, and the ongoing assembly should progress
    // - once a file finishes uploading successfully, it should have it its blob removed (even if a post processing step remains). if not successful upload it should not be removed
    const files = Object.fromEntries(
      recoveredFiles.every(([, f]) => f.progress.complete && !f.error)
        ? []
        : recoveredFiles,
    )

    const filesEntries = Object.entries(files)

    this.uppy.log(
      `[GoldenRetriever] Recovered ${Object.keys(currentUploads).length} current uploads and ${filesEntries.length} files from Local Storage`,
    )

    const hasFiles = filesEntries.length > 0

    if (!hasFiles) {
      this.uppy.log(
        '[GoldenRetriever] No files need to be loaded, restored only processing state...',
      )
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
    const filesWithBlobs: Record<
      UppyFileId,
      UppyFile<M, B>
    > = Object.fromEntries(
      filesEntries.map(([fileID, file]): [UppyFileId, UppyFile<M, B>] => {
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

        const blob: Blob | undefined = blobs[fileID]
        return [
          fileID,
          !file.progress.uploadComplete && blob == null
            ? // if we don’t have the blob (and the file is not completed uploading), mark the file as a ghost
              {
                ...file,
                isRestored: true,
                isGhost: true,
                data: undefined,
              }
            : {
                ...file,
                isRestored: true,
                isGhost: false,
                data: blob,
              },
        ]
      }),
    )

    this.uppy.setState({
      recoveredState: hasFiles ? recoveredState : null, // recoveredState is used to control the UI (to show the "recovered" state), only set it if we actually have files
      currentUploads: hasFiles ? currentUploads : {}, // if there are no files, no need to restore currentUploads. if we do, and the upload completes (but without completing all files) and the user re-adds some of the *same* files as before, the upload would use a subset of the files the user selected
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
    const existing = this.#metaDataStore.get()
    this.#metaDataStore.set({
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

  async #loadFileBlobsFromServiceWorker(): Promise<Record<UppyFileId, Blob>> {
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

  async #deleteBlobs(fileIDs: UppyFileId[]): Promise<void> {
    await Promise.all(
      fileIDs.map(async (id) => {
        try {
          await Promise.all([
            this.#serviceWorkerStore?.delete(id),
            this.#indexedDBStore.delete(id),
          ])
        } catch (err) {
          this.uppy.log(
            `[GoldenRetriever] Could not remove file ${id} from all stores`,
            'warning',
          )
          this.uppy.log(err)
        }
      }),
    )
    if (fileIDs.length > 0) {
      this.uppy.log(`[GoldenRetriever] Removed ${fileIDs.length} blobs`)
    }
  }

  async [Symbol.for('uppy test: deleteBlobs')](fileIDs: UppyFileId[]) {
    return this.#deleteBlobs(fileIDs)
  }

  #addBlobToStores = async (file: UppyFile<M, B>): Promise<void> => {
    const { id, data, isRemote } = file
    if (isRemote || data == null) return

    await Promise.all([
      this.#serviceWorkerStore?.put({ id, data }).catch((err) => {
        this.uppy.log(
          '[GoldenRetriever] Could not store file in Service Worker',
          'warning',
        )
        this.uppy.log(err)
      }),
      this.#indexedDBStore.put({ id, data }).catch((err) => {
        // idempotent; assume "Key already exists in the object store"
        if (
          err instanceof Event &&
          err.target instanceof IDBRequest &&
          err.target.error?.name === 'ConstraintError'
        ) {
          return
        }
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
  ): void => {
    if (nextState.currentUploads !== prevState.currentUploads) {
      const { currentUploads } = this.uppy.getState()
      this.#patchMetadata({ currentUploads })
    }

    if (nextState.files !== prevState.files) {
      if (
        Object.values(prevState.files).some((f) => !f.progress.complete) &&
        (Object.values(nextState.files).length === 0 ||
          Object.values(nextState.files).every(
            (f) => f.progress.complete && !f.error,
          ))
      ) {
        this.uppy.log(
          `[GoldenRetriever] All files have been uploaded and processed successfully, clearing recovery state`,
        )
        this.uppy.setState({ recoveredState: null })
      }

      // We don’t want to store file.data on local files, because the actual blob is too large and should therefore stored separately,
      // and we want to avoid having weird properties in the serialized object (like file.preview).
      const filesWithoutBlobs = Object.fromEntries(
        Object.entries(nextState.files).map(
          ([fileID, { data, preview, ...fileInfo }]) => [fileID, fileInfo],
        ),
      )
      this.#patchMetadata({ files: filesWithoutBlobs })

      const addedFiles = Object.values(nextState.files).filter(
        (nextFile) => prevState.files[nextFile.id] == null,
      )

      const editedFileBlobs = Object.values(nextState.files).flatMap(
        (nextFile) => {
          const prevFile = prevState.files[nextFile.id]
          if (prevFile != null && nextFile.data !== prevFile.data)
            return [nextFile]
          return []
        },
      )

      const deletedFiles = Object.values(prevState.files).filter((prevFile) => {
        const nextFile = nextState.files[prevFile.id]
        // also treat successfully uploaded files as deleted (when it comes to deleting their blob)
        return (
          nextFile == null ||
          (nextFile.progress.uploadComplete &&
            !prevFile.progress.uploadComplete)
        )
      })

      const blobsToDelete = [...deletedFiles, ...editedFileBlobs]
      const blobsToAdd = [...addedFiles, ...editedFileBlobs]

      ;(async () => {
        // delete old blobs that have been removed, or edited
        await this.#deleteBlobs(blobsToDelete.map((f) => f.id))
        // add new blobs for new files and edited files
        for (const blob of blobsToAdd) {
          await this.#addBlobToStores(blob)
        }
        if (blobsToAdd.length > 0) {
          this.uppy.log(`[GoldenRetriever] Added ${blobsToAdd.length} blobs`)
        }
      })()
    }
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

  #handlePluginDataChanged = (data: Record<string, unknown>): void => {
    this.#patchMetadata({ pluginData: data })
  }

  install(): void {
    this.#restore()

    this.uppy.on('state-update', this.#handleStateUpdate)
    this.uppy.on('restore-confirmed', this.#handleRestoreConfirmed)
    this.uppy.on('restore:plugin-data-changed', this.#handlePluginDataChanged)
  }

  uninstall(): void {
    this.uppy.off('state-update', this.#handleStateUpdate)
    this.uppy.off('restore-confirmed', this.#handleRestoreConfirmed)
    this.uppy.off('restore:plugin-data-changed', this.#handlePluginDataChanged)
  }
}

export { default as MetaDataStore } from './MetaDataStore.js'
