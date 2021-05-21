const throttle = require('lodash.throttle')
const { Plugin } = require('@uppy/core')
const ServiceWorkerStore = require('./ServiceWorkerStore')
const IndexedDBStore = require('./IndexedDBStore')
const MetaDataStore = require('./MetaDataStore')

/**
 * The GoldenRetriever plugin — restores selected files and resumes uploads
 * after a closed tab or a browser crash!
 *
 * Uses localStorage, IndexedDB and ServiceWorker to do its magic, read more:
 * https://uppy.io/blog/2017/07/golden-retriever/
 */
module.exports = class GoldenRetriever extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'debugger'
    this.id = this.opts.id || 'GoldenRetriever'
    this.title = 'Golden Retriever'

    const defaultOptions = {
      expires: 24 * 60 * 60 * 1000, // 24 hours
      serviceWorker: false,
    }

    this.opts = { ...defaultOptions, ...opts }

    this.MetaDataStore = new MetaDataStore({
      expires: this.opts.expires,
      storeName: uppy.getID(),
    })
    this.ServiceWorkerStore = null
    if (this.opts.serviceWorker) {
      this.ServiceWorkerStore = new ServiceWorkerStore({ storeName: uppy.getID() })
    }
    this.IndexedDBStore = new IndexedDBStore({
      expires: this.opts.expires,
      ...this.opts.indexedDB || {},
      storeName: uppy.getID(),
    })

    this.saveFilesStateToLocalStorage = throttle(
      this.saveFilesStateToLocalStorage.bind(this),
      500,
      { leading: true, trailing: true }
    )
    this.restoreState = this.restoreState.bind(this)
    this.loadFileBlobsFromServiceWorker = this.loadFileBlobsFromServiceWorker.bind(this)
    this.loadFileBlobsFromIndexedDB = this.loadFileBlobsFromIndexedDB.bind(this)
    this.onBlobsLoaded = this.onBlobsLoaded.bind(this)
  }

  restoreState () {
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
  getWaitingFiles () {
    const waitingFiles = {}

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
  getUploadingFiles () {
    const uploadingFiles = {}

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

  saveFilesStateToLocalStorage () {
    const filesToSave = {
      ...this.getWaitingFiles(),
      ...this.getUploadingFiles(),
    }

    // If all files have been removed by the user, clear recovery state
    if (Object.keys(filesToSave).length === 0) {
      this.uppy.setState({ recoveredState: null })
      MetaDataStore.cleanup(this.uppy.opts.id)
      return
    }

    // We dont’t need to store file.data on local files, because the actual blob will be restored later,
    // and we want to avoid having weird properties in the serialized object.
    // Also adding file.isRestored to all files, since they will be restored from local storage
    const filesToSaveWithoutData = {}
    Object.keys(filesToSave).forEach((file) => {
      if (filesToSave[file].isRemote) {
        filesToSaveWithoutData[file] = {
          ...filesToSave[file],
          isRestored: true,
        }
      } else {
        filesToSaveWithoutData[file] = {
          ...filesToSave[file],
          isRestored: true,
          data: null,
          preview: null,
        }
      }
    })

    const pluginData = {}
    // TODO Find a better way to do this?
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

  loadFileBlobsFromServiceWorker () {
    if (!this.ServiceWorkerStore) {
      return Promise.resolve({})
    }

    return this.ServiceWorkerStore.list().then((blobs) => {
      const files = this.uppy.getFiles()
      const localFilesOnly = files.filter((file) => {
        // maybe && !file.progress.uploadComplete
        return !file.isRemote
      })

      const numberOfFilesRecovered = Object.keys(blobs).length
      const numberOfFilesTryingToRecover = localFilesOnly.length

      if (numberOfFilesRecovered === numberOfFilesTryingToRecover) {
        this.uppy.log(`[GoldenRetriever] Successfully recovered ${numberOfFilesRecovered} blobs from Service Worker!`)
        return blobs
      }
      this.uppy.log('[GoldenRetriever] No blobs found in Service Worker, trying IndexedDB now...')
      return {}
    }).catch((err) => {
      this.uppy.log('[GoldenRetriever] Failed to recover blobs from Service Worker', 'warning')
      this.uppy.log(err)
      return {}
    })
  }

  loadFileBlobsFromIndexedDB () {
    return this.IndexedDBStore.list().then((blobs) => {
      const numberOfFilesRecovered = Object.keys(blobs).length

      if (numberOfFilesRecovered > 0) {
        this.uppy.log(`[GoldenRetriever] Successfully recovered ${numberOfFilesRecovered} blobs from IndexedDB!`)
        return blobs
      }
      this.uppy.log('[GoldenRetriever] No blobs found in IndexedDB')
      return {}
    }).catch((err) => {
      this.uppy.log('[GoldenRetriever] Failed to recover blobs from IndexedDB', 'warning')
      this.uppy.log(err)
      return {}
    })
  }

  onBlobsLoaded (blobs) {
    const obsoleteBlobs = []
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
      this.deleteBlobs(obsoleteBlobs).then(() => {
        this.uppy.log(`[GoldenRetriever] Cleaned up ${obsoleteBlobs.length} old files`)
      }).catch((err) => {
        this.uppy.log(`[GoldenRetriever] Could not clean up ${obsoleteBlobs.length} old files`, 'warning')
        this.uppy.log(err)
      })
    }
  }

  deleteBlobs (fileIDs) {
    const promises = []
    fileIDs.forEach((id) => {
      if (this.ServiceWorkerStore) {
        promises.push(this.ServiceWorkerStore.delete(id))
      }
      if (this.IndexedDBStore) {
        promises.push(this.IndexedDBStore.delete(id))
      }
    })
    return Promise.all(promises)
  }

  addBlobToStores = (file) => {
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

  removeBlobFromStores = (file) => {
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

  replaceBlobInStores = (file) => {
    this.removeBlobFromStores(file)
    this.addBlobToStores(file)
  }

  handleRestoreConfirmed = () => {
    this.uppy.log('[GoldenRetriever] Restore confirmed, proceeding...')
    // start all uploads again when file blobs are restored
    const { currentUploads } = this.uppy.getState()
    if (currentUploads) {
      Object.keys(currentUploads).forEach((uploadId) => {
        this.uppy.restore(uploadId, currentUploads[uploadId])
      })
      this.uppy.resumeAll()
    }
    this.uppy.upload()
    this.uppy.setState({ recoveredState: null })
  }

  abortRestore = () => {
    this.uppy.log('[GoldenRetriever] Aborting restore...')

    const fileIDs = Object.keys(this.uppy.getState().files)
    this.deleteBlobs(fileIDs).then(() => {
      this.uppy.log(`[GoldenRetriever] Removed ${fileIDs.length} files`)
    }).catch((err) => {
      this.uppy.log(`[GoldenRetriever] Could not remove ${fileIDs.length} files`, 'warning')
      this.uppy.log(err)
    })

    this.uppy.cancelAll()
    this.uppy.setState({ recoveredState: null })
    MetaDataStore.cleanup(this.uppy.opts.id)
  }

  handleComplete = ({ successful }) => {
    const fileIDs = successful.map((file) => file.id)
    this.deleteBlobs(fileIDs).then(() => {
      this.uppy.log(`[GoldenRetriever] Removed ${successful.length} files that finished uploading`)
    }).catch((err) => {
      this.uppy.log(`[GoldenRetriever] Could not remove ${successful.length} files that finished uploading`, 'warning')
      this.uppy.log(err)
    })

    this.uppy.setState({ recoveredState: null })
    MetaDataStore.cleanup(this.uppy.opts.id)
  }

  restoreBlobs = () => {
    if (this.uppy.getFiles().length > 0) {
      Promise.all([
        this.loadFileBlobsFromServiceWorker(),
        this.loadFileBlobsFromIndexedDB(),
      ]).then((resultingArrayOfObjects) => {
        const blobs = { ...resultingArrayOfObjects[0], ...resultingArrayOfObjects[1] }
        this.onBlobsLoaded(blobs)
      })
    } else {
      this.uppy.log('[GoldenRetriever] No files need to be loaded, only restoring processing state...')
      this.onBlobsLoaded([])
    }
  }

  install () {
    this.restoreState()
    this.restoreBlobs()

    this.uppy.on('file-added', this.addBlobToStores)
    this.uppy.on('file-editor:complete', this.replaceBlobInStores)
    this.uppy.on('file-removed', this.removeBlobFromStores)
    this.uppy.on('state-update', this.saveFilesStateToLocalStorage)
    this.uppy.on('restore-confirmed', this.handleRestoreConfirmed)
    this.uppy.on('restore-canceled', this.abortRestore)
    this.uppy.on('complete', this.handleComplete)
  }

  uninstall () {
    this.uppy.off('file-added', this.addBlobToStores)
    this.uppy.off('file-editor:complete', this.replaceBlobInStores)
    this.uppy.off('file-removed', this.removeBlobFromStores)
    this.uppy.off('state-update', this.saveFilesStateToLocalStorage)
    this.uppy.off('restore-confirmed', this.handleRestoreConfirmed)
    this.uppy.off('restore-canceled', this.abortRestore)
    this.uppy.off('complete', this.handleComplete)
  }
}
