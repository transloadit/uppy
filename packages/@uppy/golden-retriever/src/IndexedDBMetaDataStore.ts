import type { Body, Meta } from '@uppy/core'
import throttle from 'lodash/throttle.js'
import {
  connect,
  DB_NAME,
  METADATA_STORE_NAME,
  waitForRequest,
} from './IndexedDBStore.js'
import type { StoredState } from './MetaDataStore.js'

type MetaData<M extends Meta, B extends Body> = StoredState<M, B>['metadata']

// `metadata` is stored as a JSON string, not a live object. IndexedDB persists
// values via the structured clone algorithm, which *throws* on anything
// non-cloneable (e.g. a function) anywhere in the graph — whereas the
// localStorage path used `JSON.stringify`, which silently drops such values.
// Cloning the live Uppy/Transloadit state directly made `put` throw, the error
// was swallowed, and the snapshot froze at an early state — so restored files
// looked not-yet-uploaded and were ghosted. Serializing to JSON ourselves keeps
// the exact semantics of the (working) localStorage path.
type StateRecord = {
  id: string
  expires: number
  metadata: string
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
    // Attach a handler now so a connection failure can't surface as an
    // unhandledrejection before load()/#save() get a chance to await it; both
    // of those handle the rejection themselves (persistence is best-effort).
    this.#db.catch(() => {})
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
    try {
      const db = await this.#db
      const record = await waitForRequest<StateRecord | undefined>(
        db
          .transaction([METADATA_STORE_NAME])
          .objectStore(METADATA_STORE_NAME)
          .get(this.#key),
      )
      if (!record || record.expires < Date.now()) return undefined
      this.#cache = JSON.parse(record.metadata)
      return this.#cache ?? undefined
    } catch {
      // Best-effort: a corrupt record, failed read, or unavailable DB must
      // never break restore — mirrors the localStorage path's tolerant parse.
      return undefined
    }
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
        .transaction([METADATA_STORE_NAME], 'readwrite')
        .objectStore(METADATA_STORE_NAME)
      if (this.#cache == null) {
        store.delete(this.#key)
      } else {
        // JSON.stringify (not raw structured clone) so non-cloneable values are
        // dropped instead of throwing. See the StateRecord comment above.
        store.put({
          id: this.#key,
          expires: Date.now() + this.#expires,
          metadata: JSON.stringify(this.#cache),
        })
      }
    } catch {
      // Persistence is best-effort; a failed write must never break uploading.
    }
  }
}
