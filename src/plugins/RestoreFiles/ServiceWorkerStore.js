const isSupported = 'serviceWorker' in navigator

class ServiceWorkerStore {
  constructor (core) {
    this.core = core
    this.ready = new Promise((resolve, reject) => {
      // service worker stuff
      this.core.on('core:file-sw-ready', () => {
        resolve()
      })
    })
  }

  list () {
    const defer = {}
    const promise = new Promise((resolve, reject) => {
      defer.resolve = resolve
      defer.reject = reject
    })

    console.log('Loading stored blobs from Service Worker')
    const onMessage = (event) => {
      switch (event.data.type) {
        case 'ALL_FILES':
          defer.resolve(event.data.files)
          navigator.serviceWorker.removeEventListener('message', onMessage)
          break
      }
    }

    this.ready.then(() => {
      navigator.serviceWorker.addEventListener('message', onMessage)

      navigator.serviceWorker.controller.postMessage({
        type: 'GET_FILES'
      })
    })

    return promise
  }

  put (file) {
    return this.ready.then(() => {
      navigator.serviceWorker.controller.postMessage({
        type: 'ADD_FILE',
        data: {
          id: file.id,
          data: file.data
        }
      })
    })
  }

  delete (fileID) {
    return this.ready.then(() => {
      navigator.serviceWorker.controller.postMessage({
        type: 'REMOVE_FILE',
        data: fileID
      })
    })
  }
}

ServiceWorkerStore.isSupported = isSupported

module.exports = ServiceWorkerStore
