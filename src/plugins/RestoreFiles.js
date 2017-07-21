const Plugin = require('./Plugin')
const Utils = require('../core/Utils')
// import deepDiff from 'deep-diff'

/**
 * Persistent State
 *
 * Helps debug Uppy: loads saved state from localStorage, so when you restart the page,
 * your state is right where you left off. If something goes wrong, clear uppyState
 * in your localStorage, using the devTools
 *
 */
module.exports = class PersistentState extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'debugger'
    this.id = 'RestoreFiles'
    this.title = 'Restore Files'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.loadFileBlobsFromServiceWorker = this.loadFileBlobsFromServiceWorker.bind(this)
    this.saveFilesStateToLocalStorage = this.saveFilesStateToLocalStorage.bind(this)
    this.loadFilesStateFromLocalStorage = this.loadFilesStateFromLocalStorage.bind(this)
    this.saveFileBlobToServiceWorker = this.saveFileBlobToServiceWorker.bind(this)
    this.removeFileBlobFromServiceWorker = this.removeFileBlobFromServiceWorker.bind(this)
  }

  loadFileBlobsFromServiceWorker () {
    console.log('Loading stored blobs from Service Worker')
    navigator.serviceWorker.addEventListener('message', (event) => {
      switch (event.data.type) {
        case 'ALL_FILES':
          const files = event.data.files
          Object.keys(files).forEach((fileID) => {
            const cachedData = files[fileID].data

            const updatedFiles = Object.assign({}, this.core.state.files)
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
            this.core.setState({files: updatedFiles})
          })
          this.core.emit('core:restored')
          break
      }
    })

    navigator.serviceWorker.controller.postMessage({
      type: 'GET_FILES'
    })
  }

  saveFileBlobToServiceWorker (file) {
    navigator.serviceWorker.controller.postMessage({
      type: 'ADD_FILE',
      data: {
        id: file.id,
        data: file.data
      }
    })
  }

  removeFileBlobFromServiceWorker (fileID) {
    navigator.serviceWorker.controller.postMessage({
      type: 'REMOVE_FILE',
      data: fileID
    })
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

  install () {
    // local storage stuff
    this.loadFilesStateFromLocalStorage()
    this.core.on('core:state-update', this.saveFilesStateToLocalStorage)

    // service worker stuff
    this.core.on('core:file-sw-ready', () => {
      this.loadFileBlobsFromServiceWorker()

      this.core.on('core:file-added', (file) => {
        if (!file.isRemote) this.saveFileBlobToServiceWorker(file)
      })

      this.core.on('core:file-removed', (fileID) => {
        this.removeFileBlobFromServiceWorker(fileID)
      })
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
