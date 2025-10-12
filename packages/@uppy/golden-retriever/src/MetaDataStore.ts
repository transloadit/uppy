import type { Body, Meta, UppyFile, State as UppyState } from '@uppy/core'

// we don't want to store blobs in localStorage
type FileWithoutData<M extends Meta, B extends Body> = Omit<
  UppyFile<M, B>,
  'data'
>

export type StoredState<M extends Meta, B extends Body> = {
  expires: number
  metadata: {
    currentUploads: UppyState<M, B>['currentUploads']
    files: Record<string, FileWithoutData<M, B>>
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

  constructor(opts: MetaDataStoreOptions) {
    this.opts = {
      expires: 24 * 60 * 60 * 1000, // 24 hours
      ...opts,
    }
    this.name = getItemKey(opts.storeName)
  }

  /**
   *
   */
  load(): StoredState<M, B>['metadata'] | null {
    expireOldState()

    const savedState = localStorage.getItem(this.name)
    if (!savedState) return null
    const data = maybeParse<M, B>(savedState)
    if (!data) return null

    return data.metadata
  }

  save(metadata: StoredState<M, B>['metadata']): void {
    const expires = Date.now() + this.opts.expires
    const state = JSON.stringify({
      metadata,
      expires,
    })
    localStorage.setItem(this.name, state)
  }

  /**
   * Remove old state for Uppy instanceId.
   */
  static cleanup(name: string): void {
    localStorage.removeItem(getItemKey(name))
    expireOldState()
  }
}
