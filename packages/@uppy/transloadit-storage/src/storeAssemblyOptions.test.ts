import { describe, expect, it, vi } from 'vitest'
import { createStoreAssemblyOptions } from './storeAssemblyOptions.js'

const uppyWithFolder = (currentFolderId: string | null) =>
  ({
    getPlugin: (id: string) =>
      id === 'TransloaditStorage'
        ? { getPluginState: () => ({ currentFolderId }) }
        : undefined,
  }) as never

describe('createStoreAssemblyOptions', () => {
  it('stores uploads in the open folder and lets the app sign', async () => {
    const signAssembly = vi.fn(async (params) => ({
      params: { ...params, auth: { key: 'k', expires: 'later' } },
      signature: 'sha384:signed',
    }))
    const assemblyOptions = createStoreAssemblyOptions(
      uppyWithFolder(encodeURIComponent('docs/sub/')),
      { signAssembly },
    )
    const result = await assemblyOptions()
    expect(signAssembly).toHaveBeenCalledWith({
      steps: {
        stored: {
          robot: '/transloadit/store',
          use: ':original',
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Transloadit interpolates it
          path: 'docs/sub/${file.name}',
          conflict_strategy: 'overwrite',
        },
      },
    })
    expect(result.signature).toBe('sha384:signed')
    expect(result.params.auth).toEqual({ key: 'k', expires: 'later' })
  })

  it('targets the root and honours the conflict strategy and plugin id', async () => {
    const signAssembly = vi.fn(async (params) => ({ params, signature: 's' }))
    const uppy = {
      getPlugin: (id: string) =>
        id === 'Storage'
          ? { getPluginState: () => ({ currentFolderId: null }) }
          : undefined,
    } as never
    await createStoreAssemblyOptions(uppy, {
      signAssembly,
      conflictStrategy: 'rename',
      storagePluginId: 'Storage',
    })()
    expect(signAssembly.mock.calls[0]?.[0].steps.stored).toMatchObject({
      // biome-ignore lint/suspicious/noTemplateCurlyInString: Transloadit interpolates it
      path: '${file.name}',
      conflict_strategy: 'rename',
    })
  })
})
