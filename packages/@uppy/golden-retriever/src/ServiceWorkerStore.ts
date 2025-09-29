import type { Body, LocalUppyFile, Meta, UppyFile } from '@uppy/utils'
import type { AllFilesMessage, IncomingMessage } from './ServiceWorker.js'

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

  async list(): Promise<Record<string, LocalUppyFile<M, B>['data']>> {
    await this.#ready

    return new Promise<Record<string, LocalUppyFile<M, B>['data']>>(
      (resolve, reject) => {
        const onMessage = (event: MessageEvent<AllFilesMessage>) => {
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
        } satisfies IncomingMessage)
      },
    )
  }

  async put(file: LocalUppyFile<M, B>): Promise<void> {
    await this.#ready
    navigator.serviceWorker.controller!.postMessage({
      type: 'uppy/ADD_FILE',
      store: this.name,
      file,
    } satisfies IncomingMessage)
  }

  async delete(fileID: string): Promise<void> {
    await this.#ready
    navigator.serviceWorker.controller!.postMessage({
      type: 'uppy/REMOVE_FILE',
      store: this.name,
      fileID,
    } satisfies IncomingMessage)
  }
}

ServiceWorkerStore.isSupported = isSupported

export default ServiceWorkerStore
