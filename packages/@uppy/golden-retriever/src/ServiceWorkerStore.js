const isSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator

function waitForServiceWorker () {
  return new Promise((resolve, reject) => {
    if (!isSupported) {
      reject(new Error('Unsupported'))
    } else if (navigator.serviceWorker.controller) {
      // A serviceWorker is already registered and active.
      resolve()
    } else {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        resolve()
      })
    }
  })
}

class ServiceWorkerStore {
  constructor (opts) {
    this.ready = waitForServiceWorker()
    this.name = opts.storeName
  }

  list () {
    const defer = {}
    const promise = new Promise((resolve, reject) => {
      defer.resolve = resolve
      defer.reject = reject
    })

    const onMessage = (event) => {
      if (event.data.store !== this.name) {
        return
      }
      switch (event.data.type) {
        case 'uppy/ALL_FILES':
          defer.resolve(event.data.files)
          navigator.serviceWorker.removeEventListener('message', onMessage)
          break
        default:
          defer.reject()
      }
    }

    this.ready.then(() => {
      navigator.serviceWorker.addEventListener('message', onMessage)

      navigator.serviceWorker.controller.postMessage({
        type: 'uppy/GET_FILES',
        store: this.name,
      })
    })

    return promise
  }

  put (file) {
    return this.ready.then(() => {
      navigator.serviceWorker.controller.postMessage({
        type: 'uppy/ADD_FILE',
        store: this.name,
        file,
      })
    })
  }

  delete (fileID) {
    return this.ready.then(() => {
      navigator.serviceWorker.controller.postMessage({
        type: 'uppy/REMOVE_FILE',
        store: this.name,
        fileID,
      })
    })
  }
}

ServiceWorkerStore.isSupported = isSupported

export default ServiceWorkerStore
