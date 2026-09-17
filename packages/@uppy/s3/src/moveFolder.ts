/**
 * Moving a folder client-side.
 *
 * Companion's S3 provider moves one *file* at a time (`s3FolderMoveNotSupported`
 * for anything ending in `/`), because a "folder" in an object store is just a
 * key prefix: moving one means copying every object under it. Doing that in the
 * browser keeps the server request short-lived and lets an interrupted move be
 * re-run — creating a folder that already exists is treated as success.
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

/**
 * The bit of `@uppy/core/companion-client`'s `Provider` this needs — declared
 * structurally so tests can pass a fake.
 *
 * Ids are decoded keys for the mutations (as the plugin's other actions send
 * them) and URL-encoded keys for `list()` (as Companion's listing reports them).
 */
export type FolderMoveProvider = {
  list(
    directory: string | null,
    options: { signal?: AbortSignal },
  ): Promise<ListResponse>
  createFolder(parentId: string | null, name: string): Promise<unknown>
  moveItem(id: string, destination: string): Promise<unknown>
  deleteItem(id: string): Promise<unknown>
}

export type MoveFolderOptions = {
  provider: FolderMoveProvider
  /** Decoded key of the folder to move, ending with `/`. */
  source: string
  /** Decoded key the folder should end up at, ending with `/`. */
  target: string
  /** How many file moves are in flight at once. Default: 4. */
  concurrency?: number
  /** Called after every file that moved, with the number of files in total. */
  onProgress?: (done: number, total: number) => void
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

/**
 * Lists `folder` (following every page) and reports what is in it.
 */
async function listFolder(
  provider: FolderMoveProvider,
  folder: string,
): Promise<{ folders: string[]; files: string[] }> {
  const folders: string[] = []
  const files: string[] = []
  let pagePath: string | null = encodeURIComponent(folder)
  do {
    const { items, nextPagePath }: ListResponse = await provider.list(
      pagePath,
      {},
    )
    for (const item of items) {
      const key = decodeURIComponent(item.requestPath)
      if (item.isFolder) folders.push(key)
      else files.push(key)
    }
    pagePath = nextPagePath
  } while (pagePath)
  return { folders, files }
}

/**
 * Moves the folder at `source` to `target`: creates the destination folders,
 * moves every file under it (a few at a time), then deletes the emptied source
 * folders. Not atomic — a failure part-way leaves the rest behind, and running
 * it again picks up where it stopped.
 */
export default async function moveFolder({
  provider,
  source,
  target,
  concurrency = 4,
  onProgress,
}: MoveFolderOptions): Promise<void> {
  // 1. Walk the source breadth-first, so parents come before their children.
  const subFolders: string[] = []
  const files: string[] = []
  const queue: string[] = [source]
  while (queue.length > 0) {
    const folder = queue.shift() as string
    const listed = await listFolder(provider, folder)
    subFolders.push(...listed.folders)
    queue.push(...listed.folders)
    files.push(...listed.files)
  }

  // 2. Create the destination folders, parents first.
  const destinationOf = (key: string) => `${target}${key.slice(source.length)}`
  for (const folder of [target, ...subFolders.map(destinationOf)]) {
    const { parent, name } = splitFolderKey(folder)
    try {
      await provider.createFolder(parent === '' ? null : parent, name)
    } catch (err) {
      // An earlier, interrupted run may have created it already.
      if ((err as Error | undefined)?.message !== 's3AlreadyExists') throw err
    }
  }

  // 3. Move the files, a few at a time.
  let done = 0
  let next = 0
  const workers = Array.from(
    { length: Math.max(1, Math.min(concurrency, files.length)) },
    async () => {
      while (next < files.length) {
        const file = files[next++] as string
        await provider.moveItem(file, destinationOf(file))
        done += 1
        onProgress?.(done, files.length)
      }
    },
  )
  await Promise.all(workers)

  // 4. Delete the now-empty source folders, deepest first.
  for (const folder of [...subFolders].reverse()) {
    await provider.deleteItem(folder)
  }
  await provider.deleteItem(source)
}
