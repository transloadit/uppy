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
  #ready

  constructor (opts) {
    this.#ready = waitForServiceWorker().then((val) => { this.#ready = val })
    this.name = opts.storeName
  }

  get ready () {
    return Promise.resolve(this.#ready)
  }

  // TODO: remove this setter in the next major
  set ready (val) {
    this.#ready = val
  }

  async list () {
    await this.#ready

    return new Promise((resolve, reject) => {
      const onMessage = (event) => {
        if (event.data.store !== this.name) {
          return
        }
        switch (event.data.type) {
          case 'uppy/ALL_FILES':
            resolve(event.data.files)
            navigator.serviceWorker.removeEventListener('message', onMessage)
            break
          default:
            reject()
        }
      }

      navigator.serviceWorker.addEventListener('message', onMessage)

      navigator.serviceWorker.controller.postMessage({
        type: 'uppy/GET_FILES',
        store: this.name,
      })
    })
  }

  async put (file) {
    await this.#ready
    navigator.serviceWorker.controller.postMessage({
      type: 'uppy/ADD_FILE',
      store: this.name,
      file,
    })
  }

  async delete (fileID) {
    await this.#ready
    navigator.serviceWorker.controller.postMessage({
      type: 'uppy/REMOVE_FILE',
      store: this.name,
      fileID,
    })
  }
}

ServiceWorkerStore.isSupported = isSupported

export default ServiceWorkerStore
