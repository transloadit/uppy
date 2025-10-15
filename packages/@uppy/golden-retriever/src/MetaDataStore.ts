import type { Body, Meta, State as UppyState } from '@uppy/core'
import type { LocalUppyFile, RemoteUppyFile, UppyFileId } from '@uppy/utils'
import throttle from 'lodash/throttle.js'

// we don't want to store blobs in localStorage
type FileWithoutData<M extends Meta, B extends Body> =
  | Omit<LocalUppyFile<M, B>, 'data'>
  | Omit<RemoteUppyFile<M, B>, 'data'>

export type StoredState<M extends Meta, B extends Body> = {
  expires: number
  metadata: {
    currentUploads: UppyState<M, B>['currentUploads']
    files: Record<UppyFileId, FileWithoutData<M, B>>
    pluginData: Record<string, unknown>
  }
}

/**
 * Try to JSON-parse a string, return null on failure.
 */
function maybeParse<M extends Meta, B extends Body>(
  str: string,
): StoredState<M, B> | null {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

type MetaDataStoreOptions = {
  storeName: string
  expires?: number
  throttleTime?: number
}

const prefix = 'uppyState:'

const getItemKey = (name: string): string => `${prefix}${name}`

function expireOldState(): void {
  const existingKeys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(prefix)) {
      existingKeys.push(key)
    }
  }

  const now = Date.now()
  existingKeys.forEach((key) => {
    const data = localStorage.getItem(key)
    if (!data) return
    const obj = maybeParse(data)

    if (obj?.expires && obj.expires < now) {
      localStorage.removeItem(key)
    }
  })
}

export default class MetaDataStore<M extends Meta, B extends Body> {
  opts: Required<MetaDataStoreOptions>

  name: string

  // biome doesn't seem to support #fields
  #saveThrottled!: typeof this.save

  constructor(opts: MetaDataStoreOptions) {
    this.opts = {
      expires: 24 * 60 * 60 * 1000, // 24 hours
      throttleTime: 500,
      ...opts,
    }
    this.name = getItemKey(opts.storeName)

    this.#saveThrottled =
      this.opts.throttleTime === 0
        ? this.save
        : throttle(this.save, this.opts.throttleTime, {
            leading: true,
            trailing: true,
          })
  }

  #state: StoredState<M, B> | null | undefined

  /**
   *
   */
  load = (): StoredState<M, B>['metadata'] | undefined => {
    expireOldState()

    const savedState = localStorage.getItem(this.name)
    if (!savedState) return undefined
    const data = maybeParse<M, B>(savedState)
    if (!data) return undefined

    this.#state = data
    return data.metadata
  }

  get = (): StoredState<M, B>['metadata'] | undefined => {
    return this.#state?.metadata
  }

  private save = (): void => {
    if (this.#state === null) {
      localStorage.removeItem(this.name)
      return
    }
    const state = JSON.stringify(this.#state)
    localStorage.setItem(this.name, state)
  }

  /**
   * Save the given metadata to localStorage, along with an expiry timestamp.
   * If metadata is null, remove any existing stored state.
   *
   * @param metadata - The metadata to store, or null to clear the stored state.
   */
  set = (metadata: StoredState<M, B>['metadata'] | null): void => {
    this.#state =
      metadata === null
        ? null
        : {
            metadata,
            expires: Date.now() + this.opts.expires,
          }

    this.#saveThrottled()
  }
}
