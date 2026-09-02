import type { Body, Meta, Uppy } from '@uppy/core'

import { describe, expect, it } from 'vitest'
import type { StoreAssemblyParameters } from './storeAssemblyOptions.js'

import { createStoreAssemblyOptions } from './storeAssemblyOptions.js'

function fakeUppy(state: { currentFolderId?: string | null; prefix?: string }) {
  return {
    getPlugin: () => ({
      getPluginState: () => ({
        currentFolderId: state.currentFolderId ?? null,
      }),
      opts: { prefix: state.prefix },
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
