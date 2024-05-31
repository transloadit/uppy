import type { State as UppyState } from '@uppy/core'
import type { Meta, Body } from '@uppy/utils/lib/UppyFile'

export type StoredState<M extends Meta, B extends Body> = {
  expires: number
  metadata: {
    currentUploads: UppyState<M, B>['currentUploads']
    files: UppyState<M, B>['files']
    pluginData: Record<string, unknown>
  }
}

/**
 * Get uppy instance IDs for which state is stored.
 */
function findUppyInstances(): string[] {
  const instances: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('uppyState:')) {
      instances.push(key.slice('uppyState:'.length))
    }
  }
  return instances
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

let cleanedUp = false
export default class MetaDataStore<M extends Meta, B extends Body> {
  opts: Required<MetaDataStoreOptions>

  name: string

  constructor(opts: MetaDataStoreOptions) {
    this.opts = {
      expires: 24 * 60 * 60 * 1000, // 24 hours
      ...opts,
    }
    this.name = `uppyState:${opts.storeName}`

    if (!cleanedUp) {
      cleanedUp = true
      MetaDataStore.cleanup()
    }
  }

  /**
   *
   */
  load(): StoredState<M, B>['metadata'] | null {
    const savedState = localStorage.getItem(this.name)
    if (!savedState) return null
    const data = maybeParse<M, B>(savedState)
    if (!data) return null

    return data.metadata
  }

  save(metadata: Record<string, unknown>): void {
    const expires = Date.now() + this.opts.expires
    const state = JSON.stringify({
      metadata,
      expires,
    })
    localStorage.setItem(this.name, state)
  }

  /**
   * Remove all expired state.
   */
  static cleanup(instanceID?: string): void {
    if (instanceID) {
      localStorage.removeItem(`uppyState:${instanceID}`)
      return
    }

    const instanceIDs = findUppyInstances()
    const now = Date.now()
    instanceIDs.forEach((id) => {
      const data = localStorage.getItem(`uppyState:${id}`)
      if (!data) return
      const obj = maybeParse(data)
      if (!obj) return

      if (obj.expires && obj.expires < now) {
        localStorage.removeItem(`uppyState:${id}`)
      }
    })
  }
}
