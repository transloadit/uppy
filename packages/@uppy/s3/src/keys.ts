/**
 * Object-key helpers. A "folder" in an object store is a key prefix: folder
 * keys end with `/`, and the bucket root is `''`.
 */

/** Where an object key lives: its parent folder key and its own name. */
export function splitKey(key: string): {
  parent: string
  name: string
  isFolder: boolean
} {
  const isFolder = key.endsWith('/')
  const bare = isFolder ? key.slice(0, -1) : key
  const slash = bare.lastIndexOf('/')
  return {
    isFolder,
    parent: slash === -1 ? '' : bare.slice(0, slash + 1),
    name: bare.slice(slash + 1),
  }
}

/** `docs` → `docs/`; a folder key or the root (`''`) stays as it is. */
export const asFolderKey = (path: string): string =>
  path === '' || path.endsWith('/') ? path : `${path}/`
