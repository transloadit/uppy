import type { Body, Meta, Uppy } from '@uppy/core'

/** The subset of `@uppy/transloadit`'s AssemblyParameters this helper builds. */
export type StoreAssemblyParameters = {
  steps: Record<string, Record<string, unknown>>
  [key: string]: unknown
}

/** What `@uppy/transloadit` expects back from `assemblyOptions`. */
export type SignedAssemblyOptions = {
  params: StoreAssemblyParameters
  signature: string
  fields?: Record<string, string>
}

export type StoreUploadsOptions = {
  /**
   * Signs the Assembly params (adds `auth.key`/`auth.expires` and returns the
   * signature). Keep the secret on your server: this is the place to call an
   * authenticated route.
   */
  signAssembly: (
    params: StoreAssemblyParameters,
  ) => Promise<SignedAssemblyOptions>
  /** What `/transloadit/store` does when the path exists. Default: `overwrite`. */
  conflictStrategy?: 'overwrite' | 'rename' | 'error'
}

/**
 * The unsigned /transloadit/store Assembly params for uploading into
 * `folder` (a full storage key prefix, '' for the root). Apps that own the
 * upload UI (see `onUploadRequest`) sign these server-side themselves.
 */
export function buildStoreAssemblyParams(
  folder: string,
  conflictStrategy: 'overwrite' | 'rename' | 'error' = 'overwrite',
): StoreAssemblyParameters {
  return {
    steps: {
      stored: {
        robot: '/transloadit/store',
        use: ':original',
        // `${file.name}` is interpolated per file by Transloadit.
        path: `${folder}\${file.name}`,
        conflict_strategy: conflictStrategy,
      },
    },
  }
}

/**
 * Builds the `assemblyOptions` function for `@uppy/transloadit` that stores
 * every upload in the folder currently open in the Transloadit Storage panel.
 * The params are built unsigned; `signAssembly` turns them into what the
 * Transloadit plugin sends.
 */
export function createStoreAssemblyOptions<M extends Meta, B extends Body>(
  uppy: Uppy<M, B>,
  options: StoreUploadsOptions & { storagePluginId?: string },
): () => Promise<SignedAssemblyOptions> {
  const pluginId = options.storagePluginId ?? 'TransloaditStorage'
  return async () => {
    const storage = uppy.getPlugin(pluginId)
    const currentFolderId = (
      storage?.getPluginState() as { currentFolderId?: string | null }
    )?.currentFolderId
    // Folder ids are full storage keys. At the root of the browsing session
    // there is no folder id, but a grant may confine the session to a prefix
    // (the plugin's `prefix` option) — uploads must land inside it.
    const prefix = (storage as { opts?: { prefix?: string } } | undefined)?.opts
      ?.prefix
    const normalizedPrefix =
      prefix && !prefix.endsWith('/') ? `${prefix}/` : (prefix ?? '')
    const folder = currentFolderId
      ? decodeURIComponent(currentFolderId)
      : normalizedPrefix
    return options.signAssembly(
      buildStoreAssemblyParams(folder, options.conflictStrategy ?? 'overwrite'),
    )
  }
}
