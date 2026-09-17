import { describe, expect, it, vi } from 'vitest'
import moveFolder, { type FolderMoveProvider } from '../lib/moveFolder.js'

/** Folder key (`''` for the root) → the keys it contains. */
type Tree = Record<string, string[]>

type FakeProvider = FolderMoveProvider & {
  tree: Tree
  /** The highest number of `moveItem` calls that overlapped. */
  maxInFlight: number
}

const userError = (message: string) =>
  Object.assign(new Error(message), { name: 'UserFacingApiError' })

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
        throw userError('s3AlreadyExists')
      }
      state.tree[parent] = [...(state.tree[parent] ?? []), key]
      state.tree[key] = []
      return { id: key, requestPath: key }
    },
    async moveItem(id, destination) {
      if (id.endsWith('/') || destination.endsWith('/')) {
        throw userError('s3FolderMoveNotSupported')
      }
      inFlight += 1
      state.maxInFlight = Math.max(state.maxInFlight, inFlight)
      // Give the other workers a chance to start before this one lands.
      await Promise.resolve()
      await Promise.resolve()
      const from = parentOf(id)
      try {
        if (!(state.tree[from] ?? []).includes(id))
          throw userError('s3NotFound')
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
        throw userError('s3FolderNotEmpty')
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

  it('treats an existing destination folder as created, so it can be re-run', async () => {
    const provider = createFakeProvider({
      ...tree(),
      '': ['docs/', 'archive/'],
      'archive/': [],
    })

    await expect(
      moveFolder({ provider, source: 'docs/', target: 'archive/' }),
    ).resolves.toBeUndefined()
    expect(provider.tree['archive/']).toEqual([
      'archive/images/',
      'archive/hello.txt',
    ])
    expect(provider.tree['docs/']).toBeUndefined()
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
    expect(onProgress).toHaveBeenCalledTimes(9)
    expect(onProgress).toHaveBeenLastCalledWith(9, 9)
  })

  it('lets a failure from the provider through and leaves the source behind', async () => {
    const provider = createFakeProvider(tree())
    const failing: FolderMoveProvider = {
      ...provider,
      moveItem: async () => {
        throw userError('s3FileTooLargeToMove')
      },
    }

    await expect(
      moveFolder({ provider: failing, source: 'docs/', target: 'archive/' }),
    ).rejects.toThrow('s3FileTooLargeToMove')
    expect(provider.tree['docs/']).toContain('docs/hello.txt')
  })
})
