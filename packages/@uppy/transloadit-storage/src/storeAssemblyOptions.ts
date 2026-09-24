import { type Body, type Meta, type Uppy, UserFacingApiError } from '@uppy/core'
import type TransloaditStorage from './TransloaditStorage.js'

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

type ConflictStrategy = 'overwrite' | 'rename' | 'error'

export type StoreUploadsOptions = {
  /** Installed @uppy/transloadit plugin to configure; defaults to `Transloadit`. */
  transloaditPluginId?: string
  /**
   * Signs the Assembly params (adds `auth.key`/`auth.expires` and returns the
   * signature). Keep the secret on your server: this is the place to call an
   * authenticated route.
   */
  signAssembly: (
    params: StoreAssemblyParameters,
  ) => Promise<SignedAssemblyOptions>
  /** A collision fails the shared Assembly by default. Use `rename` to continue multi-file batches. */
  conflictStrategy?: ConflictStrategy
}

/** `photos` → `photos/`; empty/undefined → `''`. */
function normalizePrefix(prefix: string | undefined): string {
  return prefix && !prefix.endsWith('/') ? `${prefix}/` : (prefix ?? '')
}

/**
 * The storage key prefix of the folder open in `storage`. Folder ids are full
 * storage keys. At the root of the browsing session there is no folder id, but
 * the session may be confined to a prefix (the grant's, or the one Companion
 * serves) — uploads must land inside it.
 */
export function openFolderKey(
  storage: Pick<
    TransloaditStorage<Meta, Body>,
    'getPluginState' | 'rootPrefix'
  >,
): string {
  const { currentFolderId } = storage.getPluginState()
  return currentFolderId
    ? decodeURIComponent(currentFolderId)
    : normalizePrefix(storage.rootPrefix)
}

/**
 * The unsigned /transloadit/store Assembly params for uploading into
 * `folder` (a full storage key prefix, '' for the root). Apps that own the
 * upload UI (see `onUploadRequest`) sign these server-side themselves.
 */
export function buildStoreAssemblyParams(
  folder: string,
  conflictStrategy: ConflictStrategy = 'error',
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
    const storage = uppy.getPlugin(pluginId) as
      | TransloaditStorage<M, B>
      | undefined
    if (!storage) {
      // A wiring mistake, not something the user can act on.
      throw new Error(
        `Install the Transloadit Storage plugin "${pluginId}" before creating an Assembly`,
      )
    }
    // The session's root is only known once it is connected.
    if (
      !storage.getPluginState().authenticated &&
      !(await storage.openFolderPath(''))
    ) {
      throw new UserFacingApiError(storage.i18n('storageNotConnected'))
    }
    return options.signAssembly(
      buildStoreAssemblyParams(
        openFolderKey(storage),
        options.conflictStrategy,
      ),
    )
  }
}
