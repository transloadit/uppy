/* eslint-disable no-restricted-globals */
/* globals clients */

import type { UppyFile } from '@uppy/utils/lib/UppyFile'

const fileCache = Object.create(null)

function getCache(name: string) {
  fileCache[name] ??= Object.create(null)
  return fileCache[name]
}

self.addEventListener('install', (event) => {
  // @ts-expect-error event and self unknown
  event.waitUntil(Promise.resolve().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  // @ts-expect-error event and self unknown
  event.waitUntil(self.clients.claim())
})

function sendMessageToAllClients(msg: {
  type: string
  store: string
  files: UppyFile<any, any>[]
}) {
  // @ts-expect-error clients unknown
  clients.matchAll().then((clients) => {
    clients.forEach((client: any) => {
      client.postMessage(msg)
    })
  })
}

function addFile(store: string, file: UppyFile<any, any>) {
  getCache(store)[file.id] = file.data
}

function removeFile(store: string, fileID: string) {
  delete getCache(store)[fileID]
}

function getFiles(store: string) {
  sendMessageToAllClients({
    type: 'uppy/ALL_FILES',
    store,
    files: getCache(store),
  })
}

self.addEventListener('message', (event) => {
  switch (event.data.type) {
    case 'uppy/ADD_FILE':
      addFile(event.data.store, event.data.file)
      break
    case 'uppy/REMOVE_FILE':
      removeFile(event.data.store, event.data.fileID)
      break
    case 'uppy/GET_FILES':
      getFiles(event.data.store)
      break
    default:
      throw new Error(
        `[ServiceWorker] Unsupported event.data.type. Got: ${event?.data?.type}`,
      )
  }
})
