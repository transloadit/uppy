import type { UppyFile } from '@uppy/utils/lib/UppyFile'

const indexedDB =
  typeof window !== 'undefined' &&
  (window.indexedDB ||
    // @ts-expect-error unknown
    window.webkitIndexedDB ||
    // @ts-expect-error unknown
    window.mozIndexedDB ||
    // @ts-expect-error unknown
    window.OIndexedDB ||
    // @ts-expect-error unknown
    window.msIndexedDB)

const isSupported = !!indexedDB

const DB_NAME = 'uppy-blobs'
const STORE_NAME = 'files' // maybe have a thumbnail store in the future
const DEFAULT_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours
const DB_VERSION = 3
const MiB = 0x10_00_00

/**
 * Set default `expires` dates on existing stored blobs.
 */
function migrateExpiration(store: IDBObjectStore) {
  const request = store.openCursor()
  request.onsuccess = (event) => {
    const cursor = (event.target as IDBRequest).result
    if (!cursor) {
      return
    }
    const entry = cursor.value
    entry.expires = Date.now() + DEFAULT_EXPIRY
    cursor.update(entry)
  }
}

function connect(dbName: string): Promise<IDBDatabase> {
  const request = (indexedDB as IDBFactory).open(dbName, DB_VERSION)
  return new Promise((resolve, reject) => {
    request.onupgradeneeded = (event) => {
      const db: IDBDatabase = (event.target as IDBOpenDBRequest).result
      // eslint-disable-next-line prefer-destructuring
      const transaction = (event.currentTarget as IDBOpenDBRequest)
        .transaction as IDBTransaction

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
      resolve((event.target as IDBRequest).result)
    }
    request.onerror = reject
  })
}

function waitForRequest<T>(request: IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest).result)
    }
    request.onerror = reject
  })
}

type IndexedDBStoredFile = {
  id: string
  fileID: string
  store: string
  expires: number
  data: Blob
}

type IndexedDBStoreOptions = {
  dbName?: string
  storeName?: string
  expires?: number
  maxFileSize?: number
  maxTotalSize?: number
}

let cleanedUp = false
class IndexedDBStore {
  #ready: Promise<IDBDatabase> | IDBDatabase

  opts: Required<IndexedDBStoreOptions>

  name: string

  static isSupported: boolean

  constructor(opts?: IndexedDBStoreOptions) {
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
      this.#ready = IndexedDBStore.cleanup().then(
        createConnection,
        createConnection,
      )
    } else {
      this.#ready = createConnection()
    }
  }

  get ready(): Promise<IDBDatabase> {
    return Promise.resolve(this.#ready)
  }

  // TODO: remove this setter in the next major
  set ready(val: IDBDatabase) {
    this.#ready = val
  }

  key(fileID: string): string {
    return `${this.name}!${fileID}`
  }

  /**
   * List all file blobs currently in the store.
   */
  async list(): Promise<Record<string, IndexedDBStoredFile['data']>> {
    const db = await this.#ready
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.index('store').getAll(IDBKeyRange.only(this.name))
    const files = await waitForRequest<IndexedDBStoredFile[]>(request)
    return Object.fromEntries(files.map((file) => [file.fileID, file.data]))
  }

  /**
   * Get one file blob from the store.
   */
  async get(fileID: string): Promise<{ id: string; data: Blob }> {
    const db = await this.#ready
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const request = transaction.objectStore(STORE_NAME).get(this.key(fileID))
    const { data } = await waitForRequest<{
      data: { data: Blob; fileID: string }
    }>(request)
    return {
      id: data.fileID,
      data: data.data,
    }
  }

  /**
   * Get the total size of all stored files.
   */
  async getSize(): Promise<number> {
    const db = await this.#ready
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.index('store').openCursor(IDBKeyRange.only(this.name))
    return new Promise((resolve, reject) => {
      let size = 0
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
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
  async put<T>(file: UppyFile<any, any>): Promise<T> {
    if (file.data.size > this.opts.maxFileSize) {
      throw new Error('File is too big to store.')
    }
    const size = await this.getSize()
    if (size > this.opts.maxTotalSize) {
      throw new Error('No space left')
    }
    const db = await this.#ready
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
  async delete(fileID: string): Promise<unknown> {
    const db = await this.#ready
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const request = transaction.objectStore(STORE_NAME).delete(this.key(fileID))
    return waitForRequest(request)
  }

  /**
   * Delete all stored blobs that have an expiry date that is before Date.now().
   * This is a static method because it deletes expired blobs from _all_ Uppy instances.
   */
  static async cleanup(): Promise<void> {
    const db = await connect(DB_NAME)
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store
      .index('expires')
      .openCursor(IDBKeyRange.upperBound(Date.now()))
    await new Promise<void>((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
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
