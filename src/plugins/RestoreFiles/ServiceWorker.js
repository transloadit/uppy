/* globals clients */

const fileCache = Object.create(null)

function getCache (name) {
  if (!fileCache[name]) {
    fileCache[name] = Object.create(null)
  }
  return fileCache[name]
}

self.addEventListener('install', (event) => {
  console.log('Installing Uppy Service Worker...')

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
  getCache(store)[file.id] = file
  console.log('Added file to service worker cache:', file)
}

function removeFile (store, fileID) {
  delete getCache(store)[fileID]
  console.log('Removed file from service worker cache:', fileID)
}

function getFiles (store) {
  sendMessageToAllClients({
    type: 'ALL_FILES',
    store,
    files: getCache(store)
  })
}

self.addEventListener('message', (event) => {
  switch (event.data.type) {
    case 'ADD_FILE':
      addFile(event.data.store, event.data.data)
      break
    case 'REMOVE_FILE':
      removeFile(event.data.store, event.data.data)
      break
    case 'GET_FILES':
      getFiles(event.data.store)
      break
  }
})
