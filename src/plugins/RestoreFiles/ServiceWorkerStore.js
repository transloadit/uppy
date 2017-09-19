const isSupported = 'serviceWorker' in navigator

class ServiceWorkerStore {
  constructor (core, opts) {
    this.core = core
    this.ready = new Promise((resolve, reject) => {
      this.core.on('core:file-sw-ready', () => {
        resolve()
      })
    })
    this.name = opts.storeName
  }

  list () {
    const defer = {}
    const promise = new Promise((resolve, reject) => {
      defer.resolve = resolve
      defer.reject = reject
    })

    console.log('Loading stored blobs from Service Worker')
    const onMessage = (event) => {
      if (event.data.store !== this.name) {
        return
      }
      switch (event.data.type) {
        case 'uppy/ALL_FILES':
          defer.resolve(event.data.files)
          navigator.serviceWorker.removeEventListener('message', onMessage)
          break
      }
    }

    this.ready.then(() => {
      navigator.serviceWorker.addEventListener('message', onMessage)

      navigator.serviceWorker.controller.postMessage({
        type: 'uppy/GET_FILES',
        store: this.name
      })
    })

    return promise
  }

  put (file) {
    return this.ready.then(() => {
      navigator.serviceWorker.controller.postMessage({
        type: 'uppy/ADD_FILE',
        store: this.name,
        file: file
      })
    })
  }

  delete (fileID) {
    return this.ready.then(() => {
      navigator.serviceWorker.controller.postMessage({
        type: 'uppy/REMOVE_FILE',
        store: this.name,
        fileID: fileID
      })
    })
  }
}

ServiceWorkerStore.isSupported = isSupported

module.exports = ServiceWorkerStore
