const Plugin = require('../Plugin')
const Utils = require('../../core/Utils')
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
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    const Store = this.opts.serviceWorker ? ServiceWorkerStore : IndexedDBStore
    this.store = new Store(core)

    this.saveFilesStateToLocalStorage = this.saveFilesStateToLocalStorage.bind(this)
    this.loadFilesStateFromLocalStorage = this.loadFilesStateFromLocalStorage.bind(this)
    this.onBlobsLoaded = this.onBlobsLoaded.bind(this)
  }

  loadFilesStateFromLocalStorage () {
    const savedState = localStorage.getItem('uppyState')

    if (savedState) {
      this.core.setState(JSON.parse(savedState))
    }
  }

  saveFilesStateToLocalStorage () {
    const files = JSON.stringify({files: this.core.state.files})
    localStorage.setItem('uppyState', files)
  }

  onBlobsLoaded (blobs) {
    const updatedFiles = Object.assign({}, this.core.state.files)
    Object.keys(blobs).forEach((fileID) => {
      const cachedData = blobs[fileID].data

      const updatedFileData = {
        data: cachedData,
        isRestored: true
      }
      if (Utils.isPreviewSupported(this.core.state.files[fileID].type.specific)) {
        updatedFileData.preview = Utils.getThumbnail(cachedData)
      }
      const updatedFile = Object.assign({}, updatedFiles[fileID],
        Object.assign({}, updatedFileData)
      )
      updatedFiles[fileID] = updatedFile
    })
    this.core.setState({
      files: updatedFiles
    })
    this.core.emit('core:restored')
  }

  install () {
    // local storage stuff
    this.loadFilesStateFromLocalStorage()
    this.core.on('core:state-update', this.saveFilesStateToLocalStorage)

    this.store.list().then(this.onBlobsLoaded)

    this.core.on('core:file-added', (file) => {
      if (!file.isRemote) this.store.put(file)
    })

    this.core.on('core:file-removed', (fileID) => {
      this.store.delete(fileID)
    })

    this.core.on('core:restored', () => {
      // start all uploads again when file blobs are restored
      this.core.upload(true)
    })

    // this.loadLocalStorageState()
    // window.onbeforeunload = (ev) => {
    //   const filesObj = JSON.stringify({files: this.core.getState().files})
    //   localStorage.setItem('uppyState', filesObj)
    // }
  }
}
