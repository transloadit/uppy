import type { Body, Meta, UppyFile } from '@uppy/utils/lib/UppyFile'

const isSupported =
  typeof navigator !== 'undefined' && 'serviceWorker' in navigator

function waitForServiceWorker() {
  return new Promise<void>((resolve, reject) => {
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

export type ServiceWorkerStoredFile<M extends Meta, B extends Body> = {
  type: string
  store: string
  file: UppyFile<M, B>
}

type ServiceWorkerStoreOptions = {
  storeName: string
}

class ServiceWorkerStore<M extends Meta, B extends Body> {
  #ready: void | Promise<void>

  name: string

  static isSupported: boolean

  constructor(opts: ServiceWorkerStoreOptions) {
    this.#ready = waitForServiceWorker().then((val) => {
      this.#ready = val
    })
    this.name = opts.storeName
  }

  get ready(): Promise<void> {
    return Promise.resolve(this.#ready)
  }

  // TODO: remove this setter in the next major
  set ready(val: void) {
    this.#ready = val
  }

  async list(): Promise<ServiceWorkerStoredFile<M, B>[]> {
    await this.#ready

    return new Promise((resolve, reject) => {
      const onMessage = (event: MessageEvent) => {
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

      navigator.serviceWorker.controller!.postMessage({
        type: 'uppy/GET_FILES',
        store: this.name,
      })
    })
  }

  async put(file: UppyFile<any, any>): Promise<void> {
    await this.#ready
    navigator.serviceWorker.controller!.postMessage({
      type: 'uppy/ADD_FILE',
      store: this.name,
      file,
    })
  }

  async delete(fileID: string): Promise<void> {
    await this.#ready
    navigator.serviceWorker.controller!.postMessage({
      type: 'uppy/REMOVE_FILE',
      store: this.name,
      fileID,
    })
  }
}

ServiceWorkerStore.isSupported = isSupported

export default ServiceWorkerStore
