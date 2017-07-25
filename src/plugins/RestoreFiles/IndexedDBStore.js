const indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB

const isSupported = !!indexedDB

const DB_NAME = 'uppy-blobs'
const DB_VERSION = 1

function connect (dbName, name) {
  const request = indexedDB.open(dbName, DB_VERSION)
  return new Promise((resolve, reject) => {
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      const store = db.createObjectStore(name, { keyPath: 'id' })
      store.transaction.oncomplete = () => {
        resolve(db)
      }
    }
    request.onsuccess = (event) => {
      resolve(event.target.result)
    }
    request.onerror = reject
  })
}

function waitForRequest (request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      resolve(event.target.result)
    }
    request.onerror = reject
  })
}

class IndexedDBStore {
  constructor (core, opts) {
    this.opts = Object.assign({
      dbName: DB_NAME,
      storeName: 'default',
      maxFileSize: 10 * 1024 * 1024, // 10 MB
      maxTotalSize: 300 * 1024 * 1024 // 300 MB
    }, opts)

    this.name = this.opts.storeName
    this.ready = connect(this.opts.dbName, this.opts.storeName)
  }

  /**
   * List all file blobs currently in the store.
   */
  list () {
    return this.ready.then((db) => {
      const transaction = db.transaction([this.name], 'readonly')
      const request = transaction.objectStore(this.name).getAll()
      return waitForRequest(request)
    }).then((files) => {
      const result = {}
      files.forEach((file) => {
        result[file.id] = file
      })
      return result
    })
  }

  /**
   * Get one file blob from the store.
   */
  get (fileID) {
    return this.ready.then((db) => {
      const transaction = db.transaction([this.name], 'readonly')
      const request = transaction.objectStore(this.name).get(fileID)
      return waitForRequest(request)
    }).then((result) => result.data)
  }

  /**
   * Get the total size of all stored files.
   *
   * @private
   */
  getSize () {
    return this.ready.then((db) => {
      const transaction = db.transaction([this.name], 'readonly')
      const request = transaction.objectStore(this.name).openCursor()
      return new Promise((resolve, reject) => {
        let size = 0
        request.onsuccess = () => {
          const cursor = event.target.result
          if (cursor) {
            size += cursor.value.data.size
            cursor.continue()
          } else {
            resolve(size)
          }
        }
        request.onerror = () => {
          reject(new Error('Could not retrieve stored blobs size'))
        }
      })
    })
  }

  /**
   * Save a file in the store.
   */
  put (file) {
    if (file.data.size > this.opts.maxFileSize) {
      return Promise.reject(new Error('File is too big to store.'))
    }
    return this.getSize().then((size) => {
      if (size > this.opts.maxTotalSize) {
        return Promise.reject(new Error('No space left'))
      }
      return this.ready
    }).then((db) => {
      const transaction = db.transaction([this.name], 'readwrite')
      const request = transaction.objectStore(this.name).add({
        id: file.id,
        data: file.data
      })
      return waitForRequest(request)
    })
  }

  /**
   * Delete a file blob from the store.
   */
  delete (fileID) {
    return this.ready.then((db) => {
      const transaction = db.transaction([this.name], 'readwrite')
      const request = transaction.objectStore(this.name).delete(fileID)
      return waitForRequest(request)
    })
  }
}

IndexedDBStore.isSupported = isSupported

module.exports = IndexedDBStore
