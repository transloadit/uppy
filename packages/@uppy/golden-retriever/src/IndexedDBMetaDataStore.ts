import type { Body, Meta } from '@uppy/core'
import throttle from 'lodash/throttle.js'
import {
  connect,
  DB_NAME,
  STATE_STORE_NAME,
  waitForRequest,
} from './IndexedDBStore.js'
import type { StoredState } from './MetaDataStore.js'

type MetaData<M extends Meta, B extends Body> = StoredState<M, B>['metadata']

type StateRecord<M extends Meta, B extends Body> = {
  id: string
  expires: number
  metadata: MetaData<M, B>
}

type Options = { storeName: string; expires: number; throttleTime?: number }

/**
 * IndexedDB-backed twin of MetaDataStore. Same `load`/`get`/`set` contract, but
 * the recovery snapshot lives in IndexedDB instead of localStorage so large
 * Transloadit assemblies don't blow past localStorage's ~5MB quota (issue #6280).
 *
 * `get` stays synchronous (served from an in-memory cache) because it runs on
 * every state update; only loading and persisting touch IndexedDB.
 */
export default class IndexedDBMetaDataStore<M extends Meta, B extends Body> {
  #db: Promise<IDBDatabase>

  #cache: MetaData<M, B> | null | undefined

  #key: string

  #expires: number

  #saveThrottled: () => void

  constructor(opts: Options) {
    this.#db = connect(DB_NAME)
    this.#key = opts.storeName
    this.#expires = opts.expires
    this.#saveThrottled =
      opts.throttleTime === 0
        ? this.#save
        : throttle(this.#save, opts.throttleTime ?? 500, {
            leading: true,
            trailing: true,
          })
  }

  async load(): Promise<MetaData<M, B> | undefined> {
    const db = await this.#db
    const record = await waitForRequest<StateRecord<M, B> | undefined>(
      db
        .transaction([STATE_STORE_NAME])
        .objectStore(STATE_STORE_NAME)
        .get(this.#key),
    )
    if (!record || record.expires < Date.now()) return undefined
    this.#cache = record.metadata
    return record.metadata
  }

  get(): MetaData<M, B> | undefined {
    return this.#cache ?? undefined
  }

  set(metadata: MetaData<M, B> | null): void {
    this.#cache = metadata
    this.#saveThrottled()
  }

  #save = async (): Promise<void> => {
    try {
      const db = await this.#db
      const store = db
        .transaction([STATE_STORE_NAME], 'readwrite')
        .objectStore(STATE_STORE_NAME)
      if (this.#cache == null) {
        store.delete(this.#key)
      } else {
        store.put({
          id: this.#key,
          expires: Date.now() + this.#expires,
          metadata: this.#cache,
        })
      }
    } catch {
      // Persistence is best-effort; a failed write must never break uploading.
    }
  }
}
