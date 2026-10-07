import { act, renderHook, waitFor } from '@testing-library/react'
import { createRemoteSourceController } from '@uppy/components'
import Uppy, { BasePlugin, type PartialTreeFile } from '@uppy/core'
import { ProviderViews } from '@uppy/core/provider-views'
import { UppyContextProvider, useRemoteSource } from '@uppy/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

const file = {
  id: 'remote.txt',
  name: 'remote.txt',
  requestPath: 'remote.txt',
  isFolder: false,
  icon: '',
  type: 'file',
  mimeType: 'text/plain',
  extension: 'txt',
  size: 1,
  modifiedDate: '2020-01-01T00:00:00Z',
}

// A real ProviderView over a stubbed provider, registered under a RemoteSourceKeys id.
class FakeDropbox extends BasePlugin<any, any, any, any> {
  rootFolderId = null
  files = []
  provider = {
    name: 'Dropbox',
    provider: 'dropbox',
    login: async () => {},
    logout: async () => {},
    fetchPreAuthToken: async () => {},
    fileUrl: (path: string) => `https://companion.test/dropbox/get/${path}`,
    list: async () => ({ username: 'test', nextPagePath: null, items: [file] }),
    search: async () => ({}),
  }

  view!: InstanceType<typeof ProviderViews>

  constructor(uppy: Uppy<any, any>) {
    super(uppy, { companionUrl: 'https://companion.test' })
    this.id = 'Dropbox'
    this.type = 'acquirer'
  }

  override install() {
    this.view = new ProviderViews(this as any, {
      provider: this.provider as any,
    })
  }
}

function setup() {
  const uppy = new Uppy({ restrictions: { maxNumberOfFiles: 1 } })
  uppy.use(FakeDropbox)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <UppyContextProvider uppy={uppy}>{children}</UppyContextProvider>
  )
  return { uppy, wrapper }
}

describe('useRemoteSource', () => {
  it('recomputes error when files or restrictions change', async () => {
    const { uppy, wrapper } = setup()
    const { result } = renderHook(() => useRemoteSource('Dropbox'), {
      wrapper,
    })
    await waitFor(() =>
      expect(result.current.state.partialTree).toHaveLength(1),
    )
    act(() =>
      result.current.checkbox(
        result.current.state.partialTree[0] as PartialTreeFile,
        false,
      ),
    )
    expect(result.current.state.error).toBeNull()

    let localId = ''
    act(() => {
      localId = uppy.addFile({ name: 'local.txt', data: new Blob(['x']) })
    })
    expect(result.current.state.error).toMatch(/1 file/)

    act(() => uppy.setOptions({ restrictions: { maxNumberOfFiles: 2 } }))
    expect(result.current.state.error).toBeNull()

    act(() => uppy.setOptions({ restrictions: { maxNumberOfFiles: 1 } }))
    expect(result.current.state.error).toMatch(/1 file/)

    act(() => uppy.removeFile(localId))
    expect(result.current.state.error).toBeNull()
  })

  it('notifies only when the snapshot changes', async () => {
    const { uppy } = setup()
    const controller = createRemoteSourceController(uppy, 'Dropbox')
    const listener = vi.fn()
    controller.subscribe(listener)
    controller.mount()
    await waitFor(() =>
      expect(controller.getSnapshot().state.partialTree).toHaveLength(1),
    )
    const snapshot = controller.getSnapshot()
    snapshot.checkbox(snapshot.state.partialTree[0] as PartialTreeFile, false)

    // Adding/removing a file changes the aggregate-restriction error
    listener.mockClear()
    const localId = uppy.addFile({ name: 'local.txt', data: new Blob(['x']) })
    expect(listener).toHaveBeenCalled()
    expect(controller.getSnapshot().state.error).toMatch(/1 file/)

    listener.mockClear()
    uppy.setFileMeta(localId, { note: 'x' })
    // another plugin's state update patches the whole `plugins` object
    uppy.setState({ plugins: { ...uppy.getState().plugins, Other: { x: 1 } } })
    expect(listener).not.toHaveBeenCalled()

    uppy.removeFile(localId)
    expect(listener).toHaveBeenCalled()
    expect(controller.getSnapshot().state.error).toBeNull()
    controller.unmount()
  })
})
