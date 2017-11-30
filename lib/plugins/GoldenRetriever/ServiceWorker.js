'use strict';

/* globals clients */

var fileCache = Object.create(null);

function getCache(name) {
  if (!fileCache[name]) {
    fileCache[name] = Object.create(null);
  }
  return fileCache[name];
}

self.addEventListener('install', function (event) {
  console.log('Installing Uppy Service Worker...');

  event.waitUntil(Promise.resolve().then(function () {
    return self.skipWaiting();
  }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

function sendMessageToAllClients(msg) {
  clients.matchAll().then(function (clients) {
    clients.forEach(function (client) {
      client.postMessage(msg);
    });
  });
}

function addFile(store, file) {
  getCache(store)[file.id] = file.data;
  console.log('Added file blob to service worker cache:', file.data);
}

function removeFile(store, fileID) {
  delete getCache(store)[fileID];
  console.log('Removed file blob from service worker cache:', fileID);
}

function getFiles(store) {
  sendMessageToAllClients({
    type: 'uppy/ALL_FILES',
    store: store,
    files: getCache(store)
  });
}

self.addEventListener('message', function (event) {
  switch (event.data.type) {
    case 'uppy/ADD_FILE':
      addFile(event.data.store, event.data.file);
      break;
    case 'uppy/REMOVE_FILE':
      removeFile(event.data.store, event.data.fileID);
      break;
    case 'uppy/GET_FILES':
      getFiles(event.data.store);
      break;
  }
});
//# sourceMappingURL=ServiceWorker.js.map