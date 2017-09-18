const indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB

const isSupported = !!indexedDB

const DB_NAME = 'uppy-blobs'
const STORE_NAME = 'files' // maybe have a thumbnail store in the future
const DB_VERSION = 2

function connect (dbName) {
  const request = indexedDB.open(dbName, DB_VERSION)
  return new Promise((resolve, reject) => {
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      store.createIndex('store', 'store', { unique: false })
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
    this.ready = connect(this.opts.dbName)
  }

  key (fileID) {
    return `${this.name}!${fileID}`
  }

  /**
   * List all file blobs currently in the store.
   */
  list () {
    return this.ready.then((db) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.index('store')
        .getAll(IDBKeyRange.only(this.name))
      return waitForRequest(request)
    }).then((files) => {
      const result = {}
      files.forEach((file) => {
        result[file.fileID] = file.data
      })
      return result
    })
  }

  /**
   * Get one file blob from the store.
   */
  get (fileID) {
    return this.ready.then((db) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const request = transaction.objectStore(STORE_NAME)
        .get(this.key(fileID))
      return waitForRequest(request)
    }).then((result) => ({
      id: result.data.fileID,
      data: result.data.data
    }))
  }

  /**
   * Get the total size of all stored files.
   *
   * @private
   */
  getSize () {
    return this.ready.then((db) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.index('store')
        .openCursor(IDBKeyRange.only(this.name))
      return new Promise((resolve, reject) => {
        let size = 0
        request.onsuccess = (event) => {
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
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const request = transaction.objectStore(STORE_NAME).add({
        id: this.key(file.id),
        fileID: file.id,
        store: this.name,
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
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const request = transaction.objectStore(STORE_NAME)
        .delete(this.key(fileID))
      return waitForRequest(request)
    })
  }
}

IndexedDBStore.isSupported = isSupported

module.exports = IndexedDBStore
