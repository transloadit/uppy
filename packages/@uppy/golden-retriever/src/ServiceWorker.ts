/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope

type StoreName = string
type FileId = string
type CachedStore = Record<FileId, Blob>
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

type AllFilesMessage = {
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

type AddFilePayload = { id: FileId; data: Blob }

function addFile(store: StoreName, file: AddFilePayload): void {
  getCache(store)[file.id] = file.data
}

function removeFile(store: StoreName, fileID: FileId): void {
  delete getCache(store)[fileID]
}

function getFiles(store: StoreName): void {
  sendMessageToAllClients({
    type: 'uppy/ALL_FILES',
    store,
    files: getCache(store),
  })
}

type IncomingMessage =
  | { type: 'uppy/ADD_FILE'; store: StoreName; file: AddFilePayload }
  | { type: 'uppy/REMOVE_FILE'; store: StoreName; fileID: FileId }
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
