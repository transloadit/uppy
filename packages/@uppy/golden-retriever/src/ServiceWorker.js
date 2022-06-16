/* globals clients */

const fileCache = Object.create(null)

function getCache (name) {
  if (!fileCache[name]) {
    fileCache[name] = Object.create(null)
  }
  return fileCache[name]
}

self.addEventListener('install', (event) => {
  event.waitUntil(Promise.resolve()
    .then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

function sendMessageToAllClients (msg) {
  clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage(msg)
    })
  })
}

function addFile (store, file) {
  getCache(store)[file.id] = file.data
}

function removeFile (store, fileID) {
  delete getCache(store)[fileID]
}

function getFiles (store) {
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
      throw new Error(`[ServiceWorker] Unsupported event.data.type. Got: ${event?.data?.type}`)
  }
})
