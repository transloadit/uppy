import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import type { RemoteSourceSnapshot } from '@uppy/components'
import Uppy, { BasePlugin } from '@uppy/core'
import type { CompanionFile } from '@uppy/core/utils'
import Dropbox from '@uppy/dropbox'
import { UppyContextProvider, useRemoteSource } from '@uppy/react'
import Unsplash from '@uppy/unsplash'
import { afterEach, describe, expect, it, vi } from 'vitest'

type Listing = CompanionFile[] | Promise<CompanionFile[]>

function companionItem(name: string, isFolder = false): CompanionFile {
  return {
    id: name,
    name,
    icon: isFolder ? 'folder' : 'file',
    type: isFolder ? 'folder' : 'file',
    mimeType: isFolder ? '' : 'text/plain',
    extension: isFolder ? '' : 'txt',
    size: isFolder ? 0 : 1,
    isFolder,
    modifiedDate: '2025-01-01T00:00:00.000Z',
    requestPath: name,
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

const instances: Uppy<any, any>[] = []

afterEach(() => {
  cleanup()
  for (const uppy of instances.splice(0)) uppy.destroy()
})

/** Uppy with Dropbox, whose Companion `list` endpoint serves `listings` (keyed by folder path, `''` for the root). */
function setup(
  listings: Record<string, Listing>,
  opts?: ConstructorParameters<typeof Uppy>[0],
) {
  const uppy = new Uppy(opts).use(Dropbox, {
    companionUrl: 'https://companion.test',
  })
  instances.push(uppy)
  const list = vi
    .spyOn(uppy.getPlugin('Dropbox')!.provider, 'list')
    .mockImplementation(async (directory) => ({
      username: 'tester',
      nextPagePath: null,
      items: await listings[directory ?? ''],
    }))
  return { uppy, list }
}

/** The listed files and folders, which `state.partialTree` types as including the root. */
const listed = (source: RemoteSourceSnapshot) =>
  source.state.partialTree.filter((item) => item.type !== 'root')

function Picker({
  onClose,
  onRender,
}: {
  onClose: () => void
  onRender: (source: RemoteSourceSnapshot) => void
}) {
  const source = useRemoteSource('Dropbox', { onClose })
  onRender(source)
  return (
    <div>
      <output data-testid="selected">{source.state.selectedAmount}</output>
      <output data-testid="error">{source.state.error ?? ''}</output>
      <ul>
        {listed(source).map((item) => (
          <li key={item.id}>{item.data.name}</li>
        ))}
      </ul>
    </div>
  )
}

async function renderPicker(
  uppy: Uppy<any, any>,
  firstItemName: string,
  onClose: () => void = () => {},
) {
  let source!: RemoteSourceSnapshot
  let renders = 0
  const onRender = (s: RemoteSourceSnapshot) => {
    source = s
    renders++
  }
  const ui = (close: () => void) => (
    <UppyContextProvider uppy={uppy}>
      <Picker onClose={close} onRender={onRender} />
    </UppyContextProvider>
  )
  const result = render(ui(onClose))
  await screen.findByText(firstItemName)
  return {
    source: () => source,
    renders: () => renders,
    item: (name: string) => {
      const item = listed(source).find((i) => i.data.name === name)
      if (!item) throw new Error(`${name} is not listed`)
      return item
    },
    rerender: (close: () => void) => result.rerender(ui(close)),
    unmount: result.unmount,
  }
}

const selected = () => screen.getByTestId('selected').textContent
const error = () => screen.getByTestId('error').textContent

describe('useRemoteSource', () => {
  it('calls the latest inline onClose without re-initializing on rerender', async () => {
    const { uppy, list } = setup({
      '': [companionItem('Photos', true)],
      Photos: [companionItem('cat.txt')],
    })
    const calls: string[] = []
    const picker = await renderPicker(uppy, 'Photos', () => calls.push('first'))

    await act(() => picker.source().open('Photos'))
    await screen.findByText('cat.txt')

    picker.rerender(() => calls.push('second'))
    picker.rerender(() => calls.push('third'))

    expect(screen.getByText('cat.txt')).toBeTruthy()
    expect(list.mock.calls.map(([directory]) => directory)).toEqual([
      null,
      'Photos',
    ])

    act(() => picker.source().cancel())
    expect(calls).toEqual(['third'])
  })

  it('cancel() clears the selection and calls onClose once', async () => {
    const { uppy } = setup({ '': [companionItem('a.txt')] })
    const onClose = vi.fn()
    const picker = await renderPicker(uppy, 'a.txt', onClose)

    act(() => picker.source().checkbox(picker.item('a.txt'), false))
    expect(selected()).toBe('1')

    act(() => picker.source().cancel())

    expect(selected()).toBe('0')
    expect(uppy.getFiles()).toHaveLength(0)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('done() adds the selected files, then calls onClose once', async () => {
    const { uppy } = setup({
      '': [companionItem('a.txt'), companionItem('b.txt')],
    })
    const filesAtClose: string[][] = []
    const picker = await renderPicker(uppy, 'a.txt', () =>
      filesAtClose.push(uppy.getFiles().map((f) => f.name)),
    )

    act(() => picker.source().checkbox(picker.item('a.txt'), false))
    act(() => picker.source().checkbox(picker.item('b.txt'), false))
    await act(() => picker.source().done())

    expect(uppy.getFiles().map((f) => f.name)).toEqual(['a.txt', 'b.txt'])
    expect(filesAtClose).toEqual([['a.txt', 'b.txt']])
  })

  it('done() blocked by maxNumberOfFiles keeps the selection and stays open', async () => {
    const { uppy } = setup(
      { '': [companionItem('a.txt'), companionItem('b.txt')] },
      { restrictions: { maxNumberOfFiles: 1 } },
    )
    const onClose = vi.fn()
    const picker = await renderPicker(uppy, 'a.txt', onClose)

    act(() => picker.source().checkbox(picker.item('a.txt'), false))
    act(() => picker.source().checkbox(picker.item('b.txt'), false))
    await act(() => picker.source().done())

    expect(uppy.getFiles()).toHaveLength(0)
    expect(selected()).toBe('2')
    expect(onClose).not.toHaveBeenCalled()

    act(() => picker.source().checkbox(picker.item('b.txt'), false))
    await act(() => picker.source().done())

    expect(uppy.getFiles().map((f) => f.name)).toEqual(['a.txt'])
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('done() whose files are all rejected by onBeforeFileAdded keeps the selection and stays open', async () => {
    const { uppy } = setup(
      { '': [companionItem('a.txt')] },
      { onBeforeFileAdded: () => false },
    )
    const onClose = vi.fn()
    const picker = await renderPicker(uppy, 'a.txt', onClose)

    act(() => picker.source().checkbox(picker.item('a.txt'), false))
    await act(() => picker.source().done())

    expect(uppy.getFiles()).toHaveLength(0)
    expect(selected()).toBe('1')
    expect(onClose).not.toHaveBeenCalled()
    // no "Added 1 file" for a file that was not added
    expect(uppy.getState().info).toEqual([])
  })

  it('done() whose onBeforeFileAdded changes the file id still closes once', async () => {
    const { uppy } = setup(
      { '': [companionItem('a.txt')] },
      { onBeforeFileAdded: (file) => ({ ...file, id: `renamed-${file.id}` }) },
    )
    const onClose = vi.fn()
    const picker = await renderPicker(uppy, 'a.txt', onClose)

    act(() => picker.source().checkbox(picker.item('a.txt'), false))
    await act(() => picker.source().done())

    expect(uppy.getFiles().map((f) => f.name)).toEqual(['a.txt'])
    expect(selected()).toBe('0')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('done() that finishes after the consumer unmounted does not call onClose', async () => {
    const photos = deferred<CompanionFile[]>()
    const { uppy, list } = setup({
      '': [companionItem('Photos', true)],
      Photos: photos.promise,
    })
    const onClose = vi.fn()
    const picker = await renderPicker(uppy, 'Photos', onClose)

    act(() => picker.source().checkbox(picker.item('Photos'), false))
    let done!: Promise<void>
    act(() => {
      done = picker.source().done()
    })
    await waitFor(() =>
      expect(list.mock.calls.map(([directory]) => directory)).toContain(
        'Photos',
      ),
    )

    picker.unmount()
    photos.resolve([companionItem('cat.txt')])
    await done

    expect(uppy.getFiles().map((f) => f.name)).toEqual(['cat.txt'])
    expect(onClose).not.toHaveBeenCalled()
  })

  it('cancel() while done() is still listing a selected folder adds nothing', async () => {
    const photos = deferred<CompanionFile[]>()
    const { uppy, list } = setup({
      '': [companionItem('Photos', true)],
      Photos: photos.promise,
    })
    const onClose = vi.fn()
    const picker = await renderPicker(uppy, 'Photos', onClose)

    act(() => picker.source().checkbox(picker.item('Photos'), false))
    let done!: Promise<void>
    act(() => {
      done = picker.source().done()
    })
    await waitFor(() =>
      expect(list.mock.calls.map(([directory]) => directory)).toContain(
        'Photos',
      ),
    )

    act(() => picker.source().cancel())
    photos.resolve([companionItem('cat.txt')])
    await act(() => done)

    expect(uppy.getFiles()).toHaveLength(0)
    expect(selected()).toBe('0')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('state.error follows files added to and removed from Uppy', async () => {
    const { uppy } = setup(
      { '': [companionItem('a.txt')] },
      { restrictions: { maxNumberOfFiles: 2 } },
    )
    const picker = await renderPicker(uppy, 'a.txt')
    // Added first so the later add and remove leave the upload status
    // ('ready') unchanged, and with it the context that also re-renders.
    act(() => {
      uppy.addFile({ name: 'first.txt', data: new Blob(['x']) })
    })

    act(() => picker.source().checkbox(picker.item('a.txt'), false))
    expect(error()).toBe('')

    let secondId!: string
    act(() => {
      secondId = uppy.addFile({ name: 'second.txt', data: new Blob(['x']) })
    })
    expect(error()).not.toBe('')

    act(() => uppy.removeFile(secondId))
    expect(error()).toBe('')
  })

  it('re-renders for its own provider state, not for an unrelated plugin', async () => {
    class OtherPlugin extends BasePlugin<any, any, any> {
      constructor(uppy: Uppy<any, any>) {
        super(uppy, {})
        this.id = 'Other'
        this.type = 'modifier'
      }
    }
    const { uppy } = setup({ '': [companionItem('a.txt')] })
    uppy.use(OtherPlugin)
    const picker = await renderPicker(uppy, 'a.txt')

    const before = picker.renders()
    act(() => uppy.getPlugin('Other')!.setPluginState({ counter: 1 }))
    act(() => uppy.getPlugin('Other')!.setPluginState({ counter: 2 }))
    expect(picker.renders()).toBe(before)

    act(() => picker.source().checkbox(picker.item('a.txt'), false))
    expect(picker.renders()).toBeGreaterThan(before)
  })

  it('state.error follows restrictions changed with setOptions()', async () => {
    const { uppy } = setup({
      '': [companionItem('a.txt'), companionItem('b.txt')],
    })
    const picker = await renderPicker(uppy, 'a.txt')

    act(() => picker.source().checkbox(picker.item('a.txt'), false))
    act(() => picker.source().checkbox(picker.item('b.txt'), false))
    expect(error()).toBe('')

    act(() => uppy.setOptions({ restrictions: { maxNumberOfFiles: 1 } }))
    expect(error()).not.toBe('')
  })

  it('state.error follows the size of a file already in Uppy', async () => {
    const { uppy } = setup(
      { '': [companionItem('a.txt')] },
      { restrictions: { maxTotalFileSize: 2 } },
    )
    let id!: string
    act(() => {
      id = uppy.addFile({ name: 'first.txt', data: new Blob(['xx']) })
    })
    const picker = await renderPicker(uppy, 'a.txt')

    act(() => picker.source().checkbox(picker.item('a.txt'), false))
    expect(error()).not.toBe('')

    // e.g. the image editor or compressor shrinking a file
    act(() => uppy.setFileState(id, { size: 1 }))
    expect(error()).toBe('')
  })

  it('does not recompute for upload progress of files already in Uppy', async () => {
    const { uppy } = setup({ '': [companionItem('a.txt')] })
    let id!: string
    act(() => {
      id = uppy.addFile({ name: 'first.txt', data: new Blob(['x']) })
    })
    await renderPicker(uppy, 'a.txt')
    const view = uppy.getPlugin('Dropbox')!.view as any
    const validate = vi.spyOn(view, 'validateAggregateRestrictions')

    act(() =>
      uppy.setFileState(id, {
        progress: { ...uppy.getFile(id).progress, percentage: 1 },
      }),
    )
    expect(validate).not.toHaveBeenCalled()
  })

  it('SearchProviderView.donePicking() (Unsplash) reports whether files were added', async () => {
    let reject = true
    const uppy = new Uppy({ onBeforeFileAdded: () => !reject }).use(Unsplash, {
      companionUrl: 'https://companion.test',
    })
    instances.push(uppy)
    const plugin = uppy.getPlugin('Unsplash') as any
    vi.spyOn(plugin.provider, 'search').mockResolvedValue({
      items: [companionItem('cat.txt')],
      nextPageQuery: null,
    })
    plugin.setPluginState({ searchString: 'cat' })
    await plugin.view.search()
    const [file] = plugin.view.getDisplayedPartialTree()
    plugin.view.toggleCheckbox(file, false)

    // every file rejected: nothing added, selection kept
    expect(plugin.view.donePicking()).toBe(false)
    expect(uppy.getFiles()).toHaveLength(0)
    expect(plugin.view.getDisplayedPartialTree()[0].status).toBe('checked')

    reject = false
    expect(plugin.view.donePicking()).toBe(true)
    expect(uppy.getFiles().map((f) => f.name)).toEqual(['cat.txt'])
  })
})
