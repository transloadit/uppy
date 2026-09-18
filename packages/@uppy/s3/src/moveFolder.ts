/**
 * Folder operations done client-side.
 *
 * Companion's S3 provider moves and deletes one *entry* at a time (a folder
 * can only be deleted once empty; `moveItem` refuses folder keys unless the
 * backend moves folders natively), because a "folder" in an object store is
 * just a key prefix: moving or deleting one means touching every object under
 * it. Doing that in the browser keeps each server request short-lived, lets
 * the user cancel, and lets an interrupted operation be re-run.
 */

/** One entry of a Companion listing; only what the walk needs. */
type ListedItem = {
  /** URL-encoded object key; folders end with `/`. */
  requestPath: string
  isFolder: boolean
}

type ListResponse = {
  items: ListedItem[]
  /** Passed back to `list()` to get the next page, as `ProviderViews` does. */
  nextPagePath: string | null
}

type RequestOptions = { signal?: AbortSignal | undefined }

/**
 * The bit of `@uppy/core/companion-client`'s `Provider` this needs — declared
 * structurally so tests can pass a fake.
 *
 * Ids are decoded keys for the mutations (as the plugin's other actions send
 * them) and URL-encoded keys for `list()` (as Companion's listing reports them).
 */
export type FolderMoveProvider = {
  list(directory: string | null, options: RequestOptions): Promise<ListResponse>
  createFolder(
    parentId: string | null,
    name: string,
    options?: RequestOptions,
  ): Promise<unknown>
  moveItem(
    id: string,
    destination: string,
    options?: RequestOptions,
  ): Promise<unknown>
  deleteItem(id: string, options?: RequestOptions): Promise<unknown>
}

/** What `moveFolder` and `deleteFolder` share. */
type FolderOperationOptions = {
  provider: FolderMoveProvider
  /** How many per-file requests are in flight at once. Default: 4. */
  concurrency?: number
  /** Aborts between and inside requests; the returned promise rejects with an `AbortError`. */
  signal?: AbortSignal | undefined
  /** Called before the first file and after every file, with the total. */
  onProgress?: (done: number, total: number) => void
  /** Receives one line per step, for debugging with `uppy.log`. */
  log?: (message: string) => void
}

export type MoveFolderOptions = FolderOperationOptions & {
  /** Decoded key of the folder to move, ending with `/`. */
  source: string
  /** Decoded key the folder should end up at, ending with `/`. */
  target: string
}

export type DeleteFolderOptions = FolderOperationOptions & {
  /** Decoded key of the folder to delete, ending with `/`. */
  folder: string
}

/** Splits a folder key (`docs/photos/`) into its parent (`docs/`) and name. */
function splitFolderKey(key: string): { parent: string; name: string } {
  const bare = key.endsWith('/') ? key.slice(0, -1) : key
  const slash = bare.lastIndexOf('/')
  return {
    parent: slash === -1 ? '' : bare.slice(0, slash + 1),
    name: bare.slice(slash + 1),
  }
}

const abortError = () =>
  new DOMException('The folder operation was cancelled', 'AbortError')

const throwIfAborted = (signal: AbortSignal | undefined) => {
  if (signal?.aborted) throw abortError()
}

const assertFolderKey = (key: string, what: string) => {
  if (!key.endsWith('/')) {
    throw new Error(`${what} must be a folder key ending with "/": "${key}"`)
  }
}

/**
 * Lists `folder` (following every page) and reports what is in it. Only
 * entries that really live under `folder` count: a backend that answered with
 * something else must not steer the walk elsewhere.
 */
async function listFolder(
  provider: FolderMoveProvider,
  folder: string,
  signal: AbortSignal | undefined,
  log: (message: string) => void,
): Promise<{ folders: string[]; files: string[] }> {
  const folders = new Set<string>()
  const files = new Set<string>()
  const seenPages = new Set<string>()
  let pagePath: string | null = encodeURIComponent(folder)
  do {
    throwIfAborted(signal)
    if (seenPages.has(pagePath)) {
      throw new Error(`Listing of "${folder}" repeats page "${pagePath}"`)
    }
    seenPages.add(pagePath)
    const { items, nextPagePath }: ListResponse = await provider.list(
      pagePath,
      { signal },
    )
    for (const item of items) {
      const key = decodeURIComponent(item.requestPath)
      if (!key.startsWith(folder) || key === folder) {
        log(`ignoring "${key}": not inside "${folder}"`)
        continue
      }
      if (item.isFolder) folders.add(key)
      else files.add(key)
    }
    pagePath = nextPagePath
  } while (pagePath)
  return { folders: [...folders], files: [...files] }
}

/**
 * Walks `root` breadth-first and returns its sub-folders (parents before
 * children) and files. `skip` keeps the walk out of a subtree, e.g. a move's
 * destination.
 */
async function walkFolder(
  provider: FolderMoveProvider,
  root: string,
  signal: AbortSignal | undefined,
  log: (message: string) => void,
  skip: (folder: string) => boolean = () => false,
): Promise<{ subFolders: string[]; files: string[] }> {
  const subFolders: string[] = []
  const files: string[] = []
  const queue: string[] = [root]
  while (queue.length > 0) {
    const folder = queue.shift() as string
    const listed = await listFolder(provider, folder, signal, log)
    for (const sub of listed.folders) {
      // Defensive: never walk a folder twice, so a listing that misreports
      // entries cannot make the operation feed on itself.
      if (skip(sub) || subFolders.includes(sub)) continue
      subFolders.push(sub)
      queue.push(sub)
    }
    for (const file of listed.files) {
      if (!files.includes(file)) files.push(file)
    }
  }
  log(`found ${files.length} file(s) in ${subFolders.length + 1} folder(s)`)
  return { subFolders, files }
}

/** Runs `perFile` over `files`, a few at a time, reporting progress. */
async function forEachFile(
  files: string[],
  { concurrency = 4, signal, onProgress }: FolderOperationOptions,
  perFile: (file: string) => Promise<unknown>,
): Promise<void> {
  let done = 0
  let next = 0
  onProgress?.(0, files.length)
  const workers = Array.from(
    { length: Math.max(1, Math.min(concurrency, files.length)) },
    async () => {
      while (next < files.length) {
        throwIfAborted(signal)
        const file = files[next++] as string
        await perFile(file)
        done += 1
        onProgress?.(done, files.length)
      }
    },
  )
  await Promise.all(workers)
}

/** Deletes the (by now empty) folders, deepest first, then `root` itself. */
async function deleteEmptiedFolders(
  provider: FolderMoveProvider,
  root: string,
  subFolders: string[],
  signal: AbortSignal | undefined,
): Promise<void> {
  for (const folder of [...subFolders].reverse()) {
    throwIfAborted(signal)
    await provider.deleteItem(folder, { signal })
  }
  throwIfAborted(signal)
  await provider.deleteItem(root, { signal })
}

/**
 * Moves the folder at `source` to `target`: creates the destination folders,
 * moves every file under it (a few at a time), then deletes the emptied source
 * folders. Not atomic — a failure part-way leaves the rest behind, and running
 * it again picks up where it stopped.
 */
export default async function moveFolder(
  options: MoveFolderOptions,
): Promise<void> {
  const { provider, source, target, signal, log = () => {} } = options
  assertFolderKey(source, 'The source')
  assertFolderKey(target, 'The target')
  if (target.startsWith(source)) {
    throw new Error(`Cannot move "${source}" into itself ("${target}")`)
  }
  log(`move folder "${source}" → "${target}"`)

  // 1. Walk the source; never into the destination (S3 may list it already).
  const { subFolders, files } = await walkFolder(
    provider,
    source,
    signal,
    log,
    (folder) => folder.startsWith(target),
  )

  // 2. Create the destination folders, parents first.
  const destinationOf = (key: string) => {
    if (!key.startsWith(source)) {
      throw new Error(`"${key}" is not inside "${source}"`)
    }
    return `${target}${key.slice(source.length)}`
  }
  for (const folder of [target, ...subFolders.map(destinationOf)]) {
    throwIfAborted(signal)
    const { parent, name } = splitFolderKey(folder)
    try {
      await provider.createFolder(parent === '' ? null : parent, name, {
        signal,
      })
    } catch (err) {
      // An earlier, interrupted run may have created it already.
      if (
        (err as { code?: string } | undefined)?.code !== 'S3_ALREADY_EXISTS'
      ) {
        throw err
      }
    }
  }

  // 3. Move the files, a few at a time.
  await forEachFile(files, options, (file) => {
    const destination = destinationOf(file)
    log(`move "${file}" → "${destination}"`)
    return provider.moveItem(file, destination, { signal })
  })

  // 4. Delete the now-empty source folders.
  await deleteEmptiedFolders(provider, source, subFolders, signal)
  log(`moved "${source}" → "${target}"`)
}

/**
 * Deletes the folder at `folder` with everything in it: every file (a few at
 * a time), then the emptied folders deepest first. Not atomic — a failure
 * part-way leaves the rest behind, and running it again finishes the job.
 */
export async function deleteFolder(
  options: DeleteFolderOptions,
): Promise<void> {
  const { provider, folder, signal, log = () => {} } = options
  assertFolderKey(folder, 'The folder')
  log(`delete folder "${folder}"`)
  const { subFolders, files } = await walkFolder(provider, folder, signal, log)
  await forEachFile(files, options, (file) => {
    log(`delete "${file}"`)
    return provider.deleteItem(file, { signal })
  })
  await deleteEmptiedFolders(provider, folder, subFolders, signal)
  log(`deleted "${folder}"`)
}
