/// <reference lib="webworker" />

import type { UppyFileId } from '@uppy/utils'

declare const self: ServiceWorkerGlobalScope

type StoreName = string
type CachedStore = Record<UppyFileId, Blob>
type FileCache = Record<StoreName, CachedStore>

const fileCache: FileCache = Object.create(null)

function getCache(name: StoreName): CachedStore {
  fileCache[name] ??= Object.create(null)
  return fileCache[name]
}

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(Promise.resolve().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim())
})

export type AllFilesMessage = {
  type: 'uppy/ALL_FILES'
  store: StoreName
  files: CachedStore
}

function sendMessageToAllClients(msg: AllFilesMessage): void {
  self.clients.matchAll().then((clientList) => {
    clientList.forEach((client) => {
      client.postMessage(msg)
    })
  })
}

export type AddFilePayload = { id: UppyFileId; data: Blob }

function addFile(store: StoreName, file: AddFilePayload): void {
  getCache(store)[file.id] = file.data
}

function removeFile(store: StoreName, fileID: UppyFileId): void {
  delete getCache(store)[fileID]
}

function getFiles(store: StoreName): void {
  sendMessageToAllClients({
    type: 'uppy/ALL_FILES',
    store,
    files: getCache(store),
  })
}

export type IncomingMessage =
  | { type: 'uppy/ADD_FILE'; store: StoreName; file: AddFilePayload }
  | { type: 'uppy/REMOVE_FILE'; store: StoreName; fileID: UppyFileId }
  | { type: 'uppy/GET_FILES'; store: StoreName }

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data as IncomingMessage | undefined
  switch (data?.type) {
    case 'uppy/ADD_FILE':
      addFile(data.store, data.file)
      break
    case 'uppy/REMOVE_FILE':
      removeFile(data.store, data.fileID)
      break
    case 'uppy/GET_FILES':
      getFiles(data.store)
      break
    default:
      throw new Error(
        `[ServiceWorker] Unsupported event.data.type. Got: ${(data as any)?.type}`,
      )
  }
})
