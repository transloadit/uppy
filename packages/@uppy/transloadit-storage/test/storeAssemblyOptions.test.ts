import type { Body, Meta, Uppy } from '@uppy/core'

import { describe, expect, it, vi } from 'vitest'
import type { StoreAssemblyParameters } from '../lib/storeAssemblyOptions.js'

import {
  buildStoreAssemblyParams,
  createStoreAssemblyOptions,
} from '../lib/storeAssemblyOptions.js'

function fakeUppy(state: {
  currentFolderId?: string | null
  prefix?: string
  rootPrefix?: string
}) {
  return {
    getPlugin: () => ({
      getPluginState: () => ({
        authenticated: true,
        currentFolderId: state.currentFolderId ?? null,
      }),
      opts: { prefix: state.prefix },
      rootPrefix: state.rootPrefix ?? state.prefix ?? '',
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
      openFolderPath: vi.fn(async () => {
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
    expect(storedPath(await build())).toBe('tenant/${file.name}')
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
    }
    const build = createStoreAssemblyOptions(
      { getPlugin: () => storage } as unknown as Uppy<Meta, Body>,
      { signAssembly },
    )
    await expect(build()).rejects.toThrow('authenticate')
    expect(signAssembly).not.toHaveBeenCalled()
  })

  it('uses the authenticated grant root instead of the caller prefix option', async () => {
    const build = createStoreAssemblyOptions(
      fakeUppy({ prefix: 'wrong/', rootPrefix: 'users/ana/' }),
      { signAssembly: passthroughSign },
    )
    expect(storedPath(await build())).toBe('users/ana/${file.name}')
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
    expect(storedPath(await build())).toBe('${file.name}')
  })

  it('falls back to the grant prefix at the root of a confined session', async () => {
    const build = createStoreAssemblyOptions(
      fakeUppy({ prefix: 'users/ana/' }),
      { signAssembly: passthroughSign },
    )
    expect(storedPath(await build())).toBe('users/ana/${file.name}')
  })

  it('normalizes a prefix without a trailing slash', async () => {
    const build = createStoreAssemblyOptions(
      fakeUppy({ prefix: 'users/ana' }),
      {
        signAssembly: passthroughSign,
      },
    )
    expect(storedPath(await build())).toBe('users/ana/${file.name}')
  })

  it('uses the open folder key, which already contains the prefix', async () => {
    const build = createStoreAssemblyOptions(
      fakeUppy({
        prefix: 'users/ana/',
        currentFolderId: encodeURIComponent('users/ana/photos/'),
      }),
      { signAssembly: passthroughSign },
    )
    expect(storedPath(await build())).toBe('users/ana/photos/${file.name}')
  })

  it('passes the conflict strategy through', async () => {
    const build = createStoreAssemblyOptions(fakeUppy({}), {
      signAssembly: passthroughSign,
      conflictStrategy: 'rename',
    })
    const result = await build()
    expect(
      (result.params.steps.stored as { conflict_strategy: string })
        .conflict_strategy,
    ).toBe('rename')
  })
})
