const Plugin = require('../Plugin')
const ServiceWorkerStore = require('./ServiceWorkerStore')
const IndexedDBStore = require('./IndexedDBStore')

/**
 * Persistent State
 *
 * Helps debug Uppy: loads saved state from localStorage, so when you restart the page,
 * your state is right where you left off. If something goes wrong, clear uppyState
 * in your localStorage, using the devTools
 *
 */
module.exports = class RestoreFiles extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'debugger'
    this.id = 'RestoreFiles'
    this.title = 'Restore Files'

    // set default options
    const defaultOptions = {
      serviceWorker: false
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    // const Store = this.opts.serviceWorker ? ServiceWorkerStore : IndexedDBStore
    this.ServiceWorkerStore = this.opts.serviceWorker ? new ServiceWorkerStore(core) : false
    this.IndexedDBStore = new IndexedDBStore(core)

    this.saveFilesStateToLocalStorage = this.saveFilesStateToLocalStorage.bind(this)
    this.loadFilesStateFromLocalStorage = this.loadFilesStateFromLocalStorage.bind(this)
    this.loadFileBlobsFromServiceWorker = this.loadFileBlobsFromServiceWorker.bind(this)
    this.loadFileBlobsFromIndexedDB = this.loadFileBlobsFromIndexedDB.bind(this)
    this.onBlobsLoaded = this.onBlobsLoaded.bind(this)
  }

  loadFilesStateFromLocalStorage () {
    const savedState = localStorage.getItem('uppyState')

    if (savedState) {
      this.core.log('Recovered some state from Local Storage')
      this.core.setState(JSON.parse(savedState))
    }
  }

  saveFilesStateToLocalStorage () {
    const files = JSON.stringify({
      currentUploads: this.core.state.currentUploads,
      files: this.core.state.files
    })
    localStorage.setItem('uppyState', files)
  }

  loadFileBlobsFromServiceWorker () {
    this.ServiceWorkerStore.list().then((blobs) => {
      console.log(blobs)
      const numberOfFilesRecovered = Object.keys(blobs).length
      const numberOfFilesTryingToRecover = Object.keys(this.core.state.files).length
      if (numberOfFilesRecovered === numberOfFilesTryingToRecover) {
        this.core.log(`Successfully recovered ${numberOfFilesRecovered} blobs from Service Worker!`)
        this.core.info(`Successfully recovered ${numberOfFilesRecovered} files`, 'success', 3000)
        this.onBlobsLoaded(blobs)
      } else {
        this.core.log('Failed to recover blobs from Service Worker, trying IndexedDB now...')
        this.loadFileBlobsFromIndexedDB()
      }
    })
  }

  loadFileBlobsFromIndexedDB () {
    this.IndexedDBStore.list().then((blobs) => {
      const numberOfFilesRecovered = Object.keys(blobs).length
      if (numberOfFilesRecovered > 0) {
        this.core.log(`Successfully recovered ${numberOfFilesRecovered} blobs from Indexed DB!`)
        this.core.info(`Successfully recovered ${numberOfFilesRecovered} files`, 'success', 3000)
        return this.onBlobsLoaded(blobs)
      }
      this.core.log('Couldn’t recover anything from IndexedDB :(')
    })
  }

  onBlobsLoaded (blobs) {
    const updatedFiles = Object.assign({}, this.core.state.files)
    Object.keys(blobs).forEach((fileID) => {
      const cachedData = blobs[fileID].data

      const updatedFileData = {
        data: cachedData,
        isRestored: true
      }
      const updatedFile = Object.assign({}, updatedFiles[fileID],
        Object.assign({}, updatedFileData)
      )
      updatedFiles[fileID] = updatedFile

      this.core.generatePreview(updatedFile)
    })
    this.core.setState({
      files: updatedFiles
    })
    this.core.emit('core:restored')
  }

  install () {
    this.loadFilesStateFromLocalStorage()

    if (Object.keys(this.core.state.files).length > 0) {
      if (this.ServiceWorkerStore) {
        this.core.log('Attempting to load files from Service Worker...')
        this.loadFileBlobsFromServiceWorker()
      } else {
        this.core.log('Attempting to load files from Indexed DB...')
        this.loadFileBlobsFromIndexedDB()
      }
    }

    this.core.on('core:file-added', (file) => {
      if (file.isRemote) return

      if (this.ServiceWorkerStore) {
        this.ServiceWorkerStore.put(file).catch((err) => {
          this.core.log('Could not store file', 'error')
          this.core.log(err)
        })
      }

      this.IndexedDBStore.put(file).catch((err) => {
        this.core.log('Could not store file', 'error')
        this.core.log(err)
      })
    })

    this.core.on('core:file-removed', (fileID) => {
      if (this.ServiceWorkerStore) this.ServiceWorkerStore.delete(fileID)
      this.IndexedDBStore.delete(fileID)
    })

    this.core.on('core:state-update', this.saveFilesStateToLocalStorage)

    this.core.on('core:restored', () => {
      // start all uploads again when file blobs are restored
      const { currentUploads } = this.core.getState()
      if (currentUploads) {
        Object.keys(currentUploads).forEach((uploadId) => {
          this.core.restore(uploadId, currentUploads[uploadId])
        })
      }
    })
  }
}
