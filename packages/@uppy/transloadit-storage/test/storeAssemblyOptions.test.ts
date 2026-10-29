import type { Body, Meta, Uppy } from '@uppy/core'
import { describe, expect, it, vi } from 'vitest'
import {
  buildStoreAssemblyParams,
  createStoreAssemblyOptions,
  type StoreAssemblyParameters,
} from '../lib/storeAssemblyOptions.js'

/** Transloadit's Assembly placeholder, not a JavaScript template. */
// biome-ignore lint/suspicious/noTemplateCurlyInString: a literal placeholder.
const FILE_NAME = '${file.name}'

/** An Uppy whose connected storage plugin has `currentFolderId` open. */
function fakeUppy({
  currentFolderId = null,
  rootPrefix = '',
}: {
  currentFolderId?: string | null
  rootPrefix?: string
}) {
  return {
    getPlugin: () => ({
      getPluginState: () => ({ authenticated: true, currentFolderId }),
      rootPrefix,
    }),
  } as unknown as Uppy<Meta, Body>
}

const passthroughSign = async (params: StoreAssemblyParameters) => ({
  params,
  signature: 'sig',
})

function storedPath(result: { params: { steps: Record<string, unknown> } }) {
  return (result.params.steps.stored as { path: string }).path
}

describe('createStoreAssemblyOptions', () => {
  it('initializes the grant before choosing an upload destination', async () => {
    let authenticated = false
    const storage = {
      rootPrefix: '',
      getPluginState: () => ({ authenticated, currentFolderId: null }),
      openFolderPath: vi.fn(() => {
        authenticated = true
        storage.rootPrefix = 'tenant/'
        return true
      }),
    }
    const signAssembly = vi.fn(passthroughSign)
    const build = createStoreAssemblyOptions(
      { getPlugin: () => storage } as unknown as Uppy<Meta, Body>,
      { signAssembly },
    )
    expect(storedPath(await build())).toBe(`tenant/${FILE_NAME}`)
    expect(storage.openFolderPath).toHaveBeenCalledWith('')
    await build()
    expect(storage.openFolderPath).toHaveBeenCalledTimes(1)
  })

  it('does not ask the server to sign an upload when grant initialization fails', async () => {
    const signAssembly = vi.fn(passthroughSign)
    const storage = {
      rootPrefix: '',
      getPluginState: () => ({ authenticated: false }),
      openFolderPath: async () => false,
      i18n: (key: string) => `translated ${key}`,
    }
    const build = createStoreAssemblyOptions(
      { getPlugin: () => storage } as unknown as Uppy<Meta, Body>,
      { signAssembly },
    )
    await expect(build()).rejects.toThrow('translated storageNotConnected')
    expect(signAssembly).not.toHaveBeenCalled()
  })

  it('never silently replaces a stored file unless overwrite is explicitly requested', async () => {
    const build = createStoreAssemblyOptions(fakeUppy({}), {
      signAssembly: passthroughSign,
    })
    expect((await build()).params.steps.stored).toMatchObject({
      conflict_strategy: 'error',
    })
    expect(buildStoreAssemblyParams('photos/').steps.stored).toMatchObject({
      conflict_strategy: 'error',
    })
    expect(
      buildStoreAssemblyParams('photos/', 'overwrite').steps.stored,
    ).toMatchObject({ conflict_strategy: 'overwrite' })
  })

  it('stores at the bucket root when there is no folder and no prefix', async () => {
    const build = createStoreAssemblyOptions(fakeUppy({}), {
      signAssembly: passthroughSign,
    })
    expect(storedPath(await build())).toBe(FILE_NAME)
  })

  it('falls back to the grant prefix at the root of a confined session', async () => {
    const build = createStoreAssemblyOptions(
      fakeUppy({ rootPrefix: 'users/ana/' }),
      { signAssembly: passthroughSign },
    )
    expect(storedPath(await build())).toBe(`users/ana/${FILE_NAME}`)
  })

  it('normalizes a prefix without a trailing slash', async () => {
    const build = createStoreAssemblyOptions(
      fakeUppy({ rootPrefix: 'users/ana' }),
      {
        signAssembly: passthroughSign,
      },
    )
    expect(storedPath(await build())).toBe(`users/ana/${FILE_NAME}`)
  })

  it('uses the open folder key, which already contains the prefix', async () => {
    const build = createStoreAssemblyOptions(
      fakeUppy({
        rootPrefix: 'users/ana/',
        currentFolderId: encodeURIComponent('users/ana/photos/'),
      }),
      { signAssembly: passthroughSign },
    )
    expect(storedPath(await build())).toBe(`users/ana/photos/${FILE_NAME}`)
  })

  it('passes the conflict strategy through', async () => {
    const build = createStoreAssemblyOptions(fakeUppy({}), {
      signAssembly: passthroughSign,
      conflictStrategy: 'rename',
    })
    expect((await build()).params.steps.stored).toMatchObject({
      conflict_strategy: 'rename',
    })
  })

  it('uses a caller-provided getDestination callback instead of reading current folder', async () => {
    // Simulate: files accepted while folder A is open; then navigation moves to
    // folder B before signing resolves.  The pinned destination (A) must be used.
    const folderA = 'albums/2024/'
    const folderB = 'albums/2025/'
    let currentFolder = folderA

    const build = createStoreAssemblyOptions(
      // fakeUppy always returns currentFolder, simulating post-navigation state
      {
        getPlugin: () => ({
          getPluginState: () => ({
            authenticated: true,
            currentFolderId: null,
          }),
          rootPrefix: currentFolder,
        }),
      } as unknown as Uppy<Meta, Body>,
      {
        signAssembly: passthroughSign,
        // getDestination captures the folder at acceptance time
        getDestination: () => folderA,
      },
    )

    // Simulate navigation happening before the sign request completes
    currentFolder = folderB

    const result = await build()
    // Must use the pinned folder A, not the current folder B
    expect(storedPath(result)).toBe(`${folderA}${FILE_NAME}`)
  })

  it('falls back to reading current folder when getDestination is not provided', async () => {
    const build = createStoreAssemblyOptions(
      fakeUppy({ currentFolderId: encodeURIComponent('photos/') }),
      { signAssembly: passthroughSign },
    )
    expect(storedPath(await build())).toBe(`photos/${FILE_NAME}`)
  })
})

describe('pinned destination behaviour', () => {
  it('captures destination at acceptance time to survive navigation', async () => {
    // Arrange: stale-folder race — user accepts files in folder A, then
    // navigates to folder B while the signing request is in flight.
    const folderA = 'docs/'
    const folderB = 'archive/'

    // The pinned value represents what TransloaditStorage stored on #onFileAdded
    let pinned: string | null = folderA // captured when files were accepted

    const getDestination = () => pinned ?? folderB // returns pinned snapshot

    const build = createStoreAssemblyOptions(
      {
        getPlugin: () => ({
          getPluginState: () => ({
            authenticated: true,
            currentFolderId: null,
          }),
          rootPrefix: folderB, // current folder has already changed to B
        }),
      } as unknown as Uppy<Meta, Body>,
      { signAssembly: passthroughSign, getDestination },
    )

    const result = await build()
    // Must sign with folder A (acceptance-time snapshot), not the current B.
    expect(storedPath(result)).toBe(`${folderA}${FILE_NAME}`)
  })

  it('uses current folder when pin is null (no files yet accepted)', async () => {
    // Before any files are accepted, #pinnedDestination is null.
    // getDestination falls back to openFolderKey(this).
    const currentFolder = 'new-folder/'
    let pinned: string | null = null

    const getDestination = () => pinned ?? currentFolder

    const build = createStoreAssemblyOptions(
      {
        getPlugin: () => ({
          getPluginState: () => ({
            authenticated: true,
            currentFolderId: null,
          }),
          rootPrefix: currentFolder,
        }),
      } as unknown as Uppy<Meta, Body>,
      { signAssembly: passthroughSign, getDestination },
    )

    expect(storedPath(await build())).toBe(`${currentFolder}${FILE_NAME}`)

    // Simulate files being accepted: pin is set
    pinned = currentFolder

    // Even after the folder changes externally, the pin holds
    expect(storedPath(await build())).toBe(`${currentFolder}${FILE_NAME}`)
  })

  it('re-opening from another folder does not silently change destination of queued files', async () => {
    // Pin is set when the first batch is accepted; a second call to
    // getDestination (triggered by re-opening the modal from folder B) must
    // still return the original pinned folder A.
    const folderA = 'photos/'
    const folderB = 'videos/'
    let pinned: string | null = folderA // first batch pinned to A

    const getDestination = () => pinned ?? folderB

    const build = createStoreAssemblyOptions(
      {
        getPlugin: () => ({
          getPluginState: () => ({
            authenticated: true,
            currentFolderId: null,
          }),
          rootPrefix: folderB, // user has navigated to B
        }),
      } as unknown as Uppy<Meta, Body>,
      { signAssembly: passthroughSign, getDestination },
    )

    // Sign request arrives while folder B is current — must use A.
    expect(storedPath(await build())).toBe(`${folderA}${FILE_NAME}`)
  })
})
