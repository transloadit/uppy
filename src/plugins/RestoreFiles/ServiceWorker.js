/* globals clients */

const fileCache = {}

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

function addFile (file) {
  fileCache[file.id] = file
  console.log('Added file to service worker cache:', file)
}

function removeFile (fileID) {
  delete fileCache[fileID]
  console.log('Removed file from service worker cache:', fileID)
}

function getFiles () {
  sendMessageToAllClients({ type: 'ALL_FILES', files: fileCache })
}

self.addEventListener('message', (event) => {
  switch (event.data.type) {
    case 'ADD_FILE':
      addFile(event.data.data)
      break
    case 'REMOVE_FILE':
      removeFile(event.data.data)
      break
    case 'GET_FILES':
      getFiles()
      break
  }
})
