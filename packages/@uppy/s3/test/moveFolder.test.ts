import { describe, expect, it, vi } from 'vitest'
import moveFolder, {
  deleteFolder,
  type FolderMoveProvider,
} from '../lib/moveFolder.js'

/** Folder key (`''` for the root) → the keys it contains. */
type Tree = Record<string, string[]>

type FakeProvider = FolderMoveProvider & {
  tree: Tree
  /** The highest number of `moveItem` calls that overlapped. */
  maxInFlight: number
}

const userError = (code: string) =>
  Object.assign(new Error(code), { name: 'UserFacingApiError', code })

const parentOf = (key: string) => {
  const bare = key.endsWith('/') ? key.slice(0, -1) : key
  const slash = bare.lastIndexOf('/')
  return slash === -1 ? '' : bare.slice(0, slash + 1)
}

/**
 * A provider backed by a plain tree, close enough to Companion's S3 endpoints:
 * folders end with `/`, listings report URL-encoded keys, and a move only takes
 * files. With `pageSize` the listing is paginated, as a real bucket's is.
 */
function createFakeProvider(
  tree: Tree,
  { pageSize }: { pageSize?: number } = {},
): FakeProvider {
  const state = { tree: structuredClone(tree), maxInFlight: 0 }
  let inFlight = 0

  return {
    get tree() {
      return state.tree
    },
    get maxInFlight() {
      return state.maxInFlight
    },
    async list(directory) {
      const [encodedFolder = '', query = ''] = (directory ?? '').split('?')
      const folder = decodeURIComponent(encodedFolder)
      const page = Number(new URLSearchParams(query).get('page') ?? '0')
      const all = state.tree[folder] ?? []
      const from = pageSize ? page * pageSize : 0
      const slice = pageSize ? all.slice(from, from + pageSize) : all
      const hasMore = pageSize != null && from + pageSize < all.length
      return {
        items: slice.map((key) => ({
          requestPath: encodeURIComponent(key),
          isFolder: key.endsWith('/'),
        })),
        nextPagePath: hasMore
          ? `${encodeURIComponent(folder)}?page=${page + 1}`
          : null,
      }
    },
    async createFolder(parentId, name) {
      const parent = parentId ?? ''
      const key = `${parent}${name}/`
      if ((state.tree[parent] ?? []).includes(key)) {
        throw userError('S3_ALREADY_EXISTS')
      }
      state.tree[parent] = [...(state.tree[parent] ?? []), key]
      state.tree[key] = []
      return { id: key, requestPath: key }
    },
    async moveItem(id, destination) {
      if (id.endsWith('/') || destination.endsWith('/')) {
        throw userError('S3_FOLDER_MOVE_NOT_SUPPORTED')
      }
      inFlight += 1
      state.maxInFlight = Math.max(state.maxInFlight, inFlight)
      // Give the other workers a chance to start before this one lands.
      await Promise.resolve()
      await Promise.resolve()
      const from = parentOf(id)
      try {
        if (!(state.tree[from] ?? []).includes(id))
          throw userError('S3_NOT_FOUND')
        state.tree[from] = (state.tree[from] ?? []).filter((key) => key !== id)
        const to = parentOf(destination)
        state.tree[to] = [...(state.tree[to] ?? []), destination]
        return { id: destination, requestPath: destination }
      } finally {
        inFlight -= 1
      }
    },
    async deleteItem(id) {
      if (id.endsWith('/') && (state.tree[id] ?? []).length > 0) {
        throw userError('S3_FOLDER_NOT_EMPTY')
      }
      delete state.tree[id]
      const parent = parentOf(id)
      state.tree[parent] = (state.tree[parent] ?? []).filter(
        (key) => key !== id,
      )
      return { ok: true } as const
    },
  }
}

const tree = (): Tree => ({
  '': ['docs/', 'readme.md'],
  'docs/': ['docs/hello.txt', 'docs/images/'],
  'docs/images/': ['docs/images/logo.png'],
})

describe('moveFolder', () => {
  it('recreates the tree at the target and empties the source', async () => {
    const provider = createFakeProvider(tree())

    await moveFolder({ provider, source: 'docs/', target: 'archive/' })

    expect(provider.tree).toEqual({
      '': ['readme.md', 'archive/'],
      'archive/': ['archive/images/', 'archive/hello.txt'],
      'archive/images/': ['archive/images/logo.png'],
    })
  })

  it('moves into an existing folder', async () => {
    const provider = createFakeProvider({ ...tree(), 'backup/': [] })
    provider.tree[''] = ['docs/', 'readme.md', 'backup/']

    await moveFolder({ provider, source: 'docs/', target: 'backup/docs/' })

    expect(provider.tree['backup/']).toEqual(['backup/docs/'])
    expect(provider.tree['backup/docs/']).toEqual([
      'backup/docs/images/',
      'backup/docs/hello.txt',
    ])
    expect(provider.tree['docs/']).toBeUndefined()
  })

  it('follows every page of a listing', async () => {
    const provider = createFakeProvider(
      {
        '': ['docs/'],
        'docs/': ['docs/a.txt', 'docs/b.txt', 'docs/c.txt', 'docs/sub/'],
        'docs/sub/': ['docs/sub/d.txt'],
      },
      { pageSize: 2 },
    )

    await moveFolder({ provider, source: 'docs/', target: 'moved/' })

    expect([...(provider.tree['moved/'] ?? [])].sort()).toEqual([
      'moved/a.txt',
      'moved/b.txt',
      'moved/c.txt',
      'moved/sub/',
    ])
    expect(provider.tree['moved/sub/']).toEqual(['moved/sub/d.txt'])
  })

  it('moves files with bounded concurrency and reports progress', async () => {
    const files = Array.from({ length: 9 }, (_, i) => `docs/file-${i}.txt`)
    const provider = createFakeProvider({ '': ['docs/'], 'docs/': files })
    const onProgress = vi.fn()

    await moveFolder({
      provider,
      source: 'docs/',
      target: 'moved/',
      concurrency: 3,
      onProgress,
    })

    expect(provider.maxInFlight).toBe(3)
    expect(provider.tree['moved/']).toHaveLength(9)
    // Once up front with 0 done, then once per moved file.
    expect(onProgress).toHaveBeenCalledTimes(10)
    expect(onProgress).toHaveBeenNthCalledWith(1, 0, 9)
    expect(onProgress).toHaveBeenLastCalledWith(9, 9)
  })

  it('lets a failure from the provider through and leaves the source behind', async () => {
    const provider = createFakeProvider(tree())
    const failing: FolderMoveProvider = {
      ...provider,
      moveItem: async () => {
        throw userError('S3_FILE_TOO_LARGE_TO_MOVE')
      },
    }

    await expect(
      moveFolder({ provider: failing, source: 'docs/', target: 'archive/' }),
    ).rejects.toThrow('S3_FILE_TOO_LARGE_TO_MOVE')
    expect(provider.tree['docs/']).toContain('docs/hello.txt')
  })
})

describe('moveFolder guards', () => {
  it('refuses a target that already exists instead of merging into it', async () => {
    const provider = createFakeProvider({
      '': ['docs/', 'archive/'],
      'docs/': ['docs/hello.txt'],
      'archive/': ['archive/old.txt'],
    })
    await expect(
      moveFolder({ provider, source: 'docs/', target: 'archive/' }),
    ).rejects.toMatchObject({ code: 'S3_ALREADY_EXISTS' })
    expect(provider.tree['docs/']).toEqual(['docs/hello.txt'])
    expect(provider.tree['archive/']).toEqual(['archive/old.txt'])
  })

  it('ignores listed entries that are not inside the folder being walked', async () => {
    const provider = createFakeProvider({
      '': ['docs/', 'other/'],
      'docs/': ['docs/a.txt'],
      'other/': ['other/stray.txt'],
    })
    // A listing that misreports entries from elsewhere (another folder, the
    // root, the folder itself) must not steer the walk.
    const list = provider.list.bind(provider)
    provider.list = async (directory, options) => {
      const page = await list(directory, options)
      if (directory === 'docs%2F') {
        page.items.push(
          { requestPath: 'other%2F', isFolder: true },
          { requestPath: 'other%2Fstray.txt', isFolder: false },
          { requestPath: 'other.txt', isFolder: false },
          { requestPath: 'docs%2F', isFolder: true },
        )
      }
      return page
    }
    const log: string[] = []
    await moveFolder({
      provider,
      source: 'docs/',
      target: 'archive/',
      log: (m) => log.push(m),
    })
    expect(provider.tree['archive/']).toEqual(['archive/a.txt'])
    expect(provider.tree['other/']).toEqual(['other/stray.txt'])
    expect(provider.tree['docs/']).toBeUndefined()
    expect(log.filter((m) => m.startsWith('ignoring'))).toHaveLength(4)
  })

  it('refuses a target inside the source and keys without a trailing slash', async () => {
    const provider = createFakeProvider(tree())
    await expect(
      moveFolder({ provider, source: 'docs/', target: 'docs/inner/' }),
    ).rejects.toThrow(/into itself/)
    await expect(
      moveFolder({ provider, source: 'docs', target: 'archive/' }),
    ).rejects.toThrow(/must be a folder key/)
    expect(provider.tree).toEqual(tree())
  })

  it('stops with an AbortError when the signal aborts, leaving the rest in place', async () => {
    const provider = createFakeProvider({
      '': ['docs/'],
      'docs/': ['docs/1.txt', 'docs/2.txt', 'docs/3.txt', 'docs/4.txt'],
    })
    const controller = new AbortController()
    const moved: number[] = []
    const promise = moveFolder({
      provider,
      source: 'docs/',
      target: 'archive/',
      concurrency: 1,
      signal: controller.signal,
      onProgress: (done) => {
        moved.push(done)
        if (done === 2) controller.abort()
      },
    })
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
    expect(provider.tree['docs/']).toEqual(['docs/3.txt', 'docs/4.txt'])
    expect(provider.tree['archive/']).toEqual([
      'archive/1.txt',
      'archive/2.txt',
    ])
  })

  it('does not loop on a listing whose next page never advances', async () => {
    const provider = createFakeProvider(tree())
    const list = provider.list.bind(provider)
    provider.list = async (directory) => ({
      ...(await list(directory, {})),
      nextPagePath: 'docs%2F?page=0',
    })
    await expect(
      moveFolder({ provider, source: 'docs/', target: 'archive/' }),
    ).rejects.toThrow(/repeats page/)
  })
})

describe('deleteFolder', () => {
  it('deletes every file, then the emptied folders deepest first', async () => {
    const provider = createFakeProvider(tree())
    const order: string[] = []
    const deleteItem = provider.deleteItem.bind(provider)
    provider.deleteItem = async (id, options) => {
      order.push(id)
      return deleteItem(id, options)
    }
    const progress: number[] = []
    await deleteFolder({
      provider,
      folder: 'docs/',
      concurrency: 1,
      onProgress: (done) => progress.push(done),
    })
    expect(provider.tree).toEqual({ '': ['readme.md'] })
    expect(order).toEqual([
      'docs/hello.txt',
      'docs/images/logo.png',
      'docs/images/',
      'docs/',
    ])
    expect(progress).toEqual([0, 1, 2])
  })

  it('refuses a key without a trailing slash and stops on abort', async () => {
    const provider = createFakeProvider(tree())
    await expect(deleteFolder({ provider, folder: 'docs' })).rejects.toThrow(
      /must be a folder key/,
    )
    const controller = new AbortController()
    await expect(
      deleteFolder({
        provider,
        folder: 'docs/',
        concurrency: 1,
        signal: controller.signal,
        onProgress: (done) => {
          if (done === 1) controller.abort()
        },
      }),
    ).rejects.toMatchObject({ name: 'AbortError' })
    // One file gone, the rest untouched: running it again finishes the job.
    expect(provider.tree['docs/']).toEqual(['docs/images/'])
    await deleteFolder({ provider, folder: 'docs/' })
    expect(provider.tree).toEqual({ '': ['readme.md'] })
  })
})
