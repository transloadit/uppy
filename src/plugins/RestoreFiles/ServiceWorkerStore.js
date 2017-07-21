const isSupported = 'serviceWorker' in navigator

class ServiceWorkerStore {
  constructor (core) {
    this.core = core
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
    navigator.serviceWorker.addEventListener('message', onMessage)

    navigator.serviceWorker.controller.postMessage({
      type: 'GET_FILES'
    })

    return promise
  }

  put (file) {
    navigator.serviceWorker.controller.postMessage({
      type: 'ADD_FILE',
      data: {
        id: file.id,
        data: file.data
      }
    })
  }

  delete (fileID) {
    navigator.serviceWorker.controller.postMessage({
      type: 'REMOVE_FILE',
      data: fileID
    })
  }
}

ServiceWorkerStore.isSupported = isSupported

module.exports = ServiceWorkerStore
