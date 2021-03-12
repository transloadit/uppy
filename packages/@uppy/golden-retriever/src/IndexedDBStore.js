const prettierBytes = require('@transloadit/prettier-bytes')
const indexedDB = typeof window !== 'undefined' &&
  (window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB)

const isSupported = !!indexedDB

const DB_NAME = 'uppy-blobs'
const STORE_NAME = 'files' // maybe have a thumbnail store in the future
const DEFAULT_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours
const DB_VERSION = 3

// Set default `expires` dates on existing stored blobs.
function migrateExpiration (store) {
  const request = store.openCursor()
  request.onsuccess = (event) => {
    const cursor = event.target.result
    if (!cursor) {
      return
    }
    const entry = cursor.value
    entry.expires = Date.now() + DEFAULT_EXPIRY
    cursor.update(entry)
  }
}

function connect (dbName) {
  const request = indexedDB.open(dbName, DB_VERSION)
  return new Promise((resolve, reject) => {
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      const transaction = event.currentTarget.transaction

      if (event.oldVersion < 2) {
        // Added in v2: DB structure changed to a single shared object store
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('store', 'store', { unique: false })
      }

      if (event.oldVersion < 3) {
        // Added in v3
        const store = transaction.objectStore(STORE_NAME)
        store.createIndex('expires', 'expires', { unique: false })

        migrateExpiration(store)
      }

      transaction.oncomplete = () => {
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

let cleanedUp = false
class IndexedDBStore {
  constructor (opts) {
    this.opts = Object.assign({
      dbName: DB_NAME,
      storeName: 'default',
      expires: DEFAULT_EXPIRY, // 24 hours
      maxFileSize: 10 * 1024 * 1024, // 10 MB
      maxTotalSize: 300 * 1024 * 1024 // 300 MB
    }, opts)

    this.name = this.opts.storeName

    const createConnection = () => {
      return connect(this.opts.dbName)
    }

    if (!cleanedUp) {
      cleanedUp = true
      this.ready = IndexedDBStore.cleanup()
        .then(createConnection, createConnection)
    } else {
      this.ready = createConnection()
    }
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
        expires: Date.now() + this.opts.expires,
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

  /**
   * Delete all stored blobs that have an expiry date that is before Date.now().
   * This is a static method because it deletes expired blobs from _all_ Uppy instances.
   */
  static cleanup () {
    return connect(DB_NAME).then((db) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.index('expires')
        .openCursor(IDBKeyRange.upperBound(Date.now()))
      return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) {
            const entry = cursor.value
            console.log(
              '[IndexedDBStore] Deleting record', entry.fileID,
              'of size', prettierBytes(entry.data.size),
              '- expired on', new Date(entry.expires))
            cursor.delete() // Ignoring return value … it's not terrible if this goes wrong.
            cursor.continue()
          } else {
            resolve(db)
          }
        }
        request.onerror = reject
      })
    }).then((db) => {
      db.close()
    })
  }
}

IndexedDBStore.isSupported = isSupported

module.exports = IndexedDBStore
