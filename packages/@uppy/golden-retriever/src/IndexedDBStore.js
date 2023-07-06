/**
 * @type {typeof window.indexedDB}
 */
const indexedDB = typeof window !== 'undefined'
  && (window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB)

const isSupported = !!indexedDB

const DB_NAME = 'uppy-blobs'
const STORE_NAME = 'files' // maybe have a thumbnail store in the future
const DEFAULT_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours
const DB_VERSION = 3
const MiB = 0x10_00_00

/**
 * Set default `expires` dates on existing stored blobs.
 *
 * @param {IDBObjectStore} store
 */
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

/**
 * @param {string} dbName
 * @returns {Promise<IDBDatabase>}
 */
function connect (dbName) {
  const request = indexedDB.open(dbName, DB_VERSION)
  return new Promise((resolve, reject) => {
    request.onupgradeneeded = (event) => {
      /**
       * @type {IDBDatabase}
       */
      const db = event.target.result
      /**
       * @type {IDBTransaction}
       */
      const { transaction } = event.currentTarget

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

/**
 * @template T
 * @param {IDBRequest<T>} request
 * @returns {Promise<T>}
 */
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
  /**
   * @type {Promise<IDBDatabase> | IDBDatabase}
   */
  #ready

  constructor (opts) {
    this.opts = {
      dbName: DB_NAME,
      storeName: 'default',
      expires: DEFAULT_EXPIRY, // 24 hours
      maxFileSize: 10 * MiB,
      maxTotalSize: 300 * MiB,
      ...opts,
    }

    this.name = this.opts.storeName

    const createConnection = async () => {
      const db = await connect(this.opts.dbName)
      this.#ready = db
      return db
    }

    if (!cleanedUp) {
      cleanedUp = true
      this.#ready = IndexedDBStore.cleanup()
        .then(createConnection, createConnection)
    } else {
      this.#ready = createConnection()
    }
  }

  get ready () {
    return Promise.resolve(this.#ready)
  }

  // TODO: remove this setter in the next major
  set ready (val) {
    this.#ready = val
  }

  key (fileID) {
    return `${this.name}!${fileID}`
  }

  /**
   * List all file blobs currently in the store.
   */
  async list () {
    const db = await this.#ready
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.index('store')
      .getAll(IDBKeyRange.only(this.name))
    const files = await waitForRequest(request)
    return Object.fromEntries(files.map(file => [file.fileID, file.data]))
  }

  /**
   * Get one file blob from the store.
   */
  async get (fileID) {
    const db = await this.#ready
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const request = transaction.objectStore(STORE_NAME)
      .get(this.key(fileID))
    const { data } = await waitForRequest(request)
    return {
      id: data.fileID,
      data: data.data,
    }
  }

  /**
   * Get the total size of all stored files.
   *
   * @private
   * @returns {Promise<number>}
   */
  async getSize () {
    const db = await this.#ready
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
  }

  /**
   * Save a file in the store.
   */
  async put (file) {
    if (file.data.size > this.opts.maxFileSize) {
      throw new Error('File is too big to store.')
    }
    const size = await this.getSize()
    if (size > this.opts.maxTotalSize) {
      throw new Error('No space left')
    }
    const db = this.#ready
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const request = transaction.objectStore(STORE_NAME).add({
      id: this.key(file.id),
      fileID: file.id,
      store: this.name,
      expires: Date.now() + this.opts.expires,
      data: file.data,
    })
    return waitForRequest(request)
  }

  /**
   * Delete a file blob from the store.
   */
  async delete (fileID) {
    const db = await this.#ready
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const request = transaction.objectStore(STORE_NAME)
      .delete(this.key(fileID))
    return waitForRequest(request)
  }

  /**
   * Delete all stored blobs that have an expiry date that is before Date.now().
   * This is a static method because it deletes expired blobs from _all_ Uppy instances.
   */
  static async cleanup () {
    const db = await connect(DB_NAME)
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.index('expires')
      .openCursor(IDBKeyRange.upperBound(Date.now()))
    await new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          cursor.delete() // Ignoring return value … it's not terrible if this goes wrong.
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = reject
    })
    db.close()
  }
}

IndexedDBStore.isSupported = isSupported

export default IndexedDBStore
