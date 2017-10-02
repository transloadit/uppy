const isSupported = 'serviceWorker' in navigator

function isUppyServiceWorker () {
  navigator.serviceWorker.controller.postMessage({
    type: 'uppy/PROBE'
  })
  return new Promise((resolve, reject) => {
    const onNoResponse = () => {
      reject(new Error('Not an Uppy Service Worker'))
      navigator.serviceWorker.removeEventListener('message', onResponse)
    }
    const timer = setTimeout(onNoResponse, 1000)

    const onResponse = (event) => {
      if (event.data && event.data.type === 'uppy/HERE_I_AM') {
        resolve()
        clearTimeout(timer)
      }
    }
    navigator.serviceWorker.addEventListener('message', onResponse)
  })
}

function waitForServiceWorker () {
  return new Promise((resolve, reject) => {
    if (!('serviceWorker' in navigator)) {
      reject(new Error('Unsupported'))
    } else if (navigator.serviceWorker.controller) {
      // A serviceWorker is already registered and active.
      resolve()
    } else {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        resolve()
      })
    }
  }).then(() => {
    return isUppyServiceWorker()
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
