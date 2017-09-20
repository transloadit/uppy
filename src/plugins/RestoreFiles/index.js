const Plugin = require('../Plugin')
const ServiceWorkerStore = require('./ServiceWorkerStore')
const IndexedDBStore = require('./IndexedDBStore')

/**
* Restore Files plugin — restores selected files and resumes uploads
* after a closed tab or a browser crash!
*
* Uses localStorage, IndexedDB and ServiceWorker to do its magic, read more:
* https://uppy.io/blog/2017/07/golden-retriever/
*/
module.exports = class RestoreFiles extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'debugger'
    this.id = 'RestoreFiles'
    this.title = 'Restore Files'

    const defaultOptions = {
      serviceWorker: false
    }

    this.opts = Object.assign({}, defaultOptions, opts)

    this.ServiceWorkerStore = null
    if (this.opts.serviceWorker) {
      this.ServiceWorkerStore = new ServiceWorkerStore(core, { storeName: core.getID() })
    }
    this.IndexedDBStore = new IndexedDBStore(core, Object.assign({},
      opts.indexedDB || {},
      { storeName: core.getID() }))

    this.saveFilesStateToLocalStorage = this.saveFilesStateToLocalStorage.bind(this)
    this.loadFilesStateFromLocalStorage = this.loadFilesStateFromLocalStorage.bind(this)
    this.loadFileBlobsFromServiceWorker = this.loadFileBlobsFromServiceWorker.bind(this)
    this.loadFileBlobsFromIndexedDB = this.loadFileBlobsFromIndexedDB.bind(this)
    this.onBlobsLoaded = this.onBlobsLoaded.bind(this)
  }

  loadFilesStateFromLocalStorage () {
    const savedState = localStorage.getItem(`uppyState:${this.core.opts.id}`)

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
    localStorage.setItem(`uppyState:${this.core.opts.id}`, files)
  }

  loadFileBlobsFromServiceWorker () {
    this.ServiceWorkerStore.list().then((blobs) => {
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
    const obsoleteBlobs = []
    const updatedFiles = Object.assign({}, this.core.state.files)
    Object.keys(blobs).forEach((fileID) => {
      const originalFile = this.core.getFile(fileID)
      if (!originalFile) {
        obsoleteBlobs.push(fileID)
        return
      }

      const cachedData = blobs[fileID]

      const updatedFileData = {
        data: cachedData,
        isRestored: true
      }
      const updatedFile = Object.assign({}, originalFile, updatedFileData)
      updatedFiles[fileID] = updatedFile

      this.core.generatePreview(updatedFile)
    })
    this.core.setState({
      files: updatedFiles
    })
    this.core.emit('core:restored')

    if (obsoleteBlobs.length) {
      this.deleteBlobs(obsoleteBlobs).then(() => {
        this.core.log(`RestoreFiles: cleaned up ${obsoleteBlobs.length} old files`)
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
