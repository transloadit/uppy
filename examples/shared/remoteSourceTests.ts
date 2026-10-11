import Uppy, { type UnknownProviderPlugin } from '@uppy/core'
import RemoteSources from '@uppy/remote-sources'
import { describe, expect, test, vi } from 'vitest'
import { type LocatorSelectors, userEvent } from 'vitest/browser'

const companionFile = (id: string, isFolder = false) => ({
  id,
  name: id,
  requestPath: id,
  isFolder,
  icon: '',
  type: isFolder ? 'folder' : 'file',
  mimeType: isFolder ? '' : 'text/plain',
  extension: isFolder ? '' : 'txt',
  size: 1,
  modifiedDate: '2020-01-01T00:00:00Z',
})

const listings: Record<string, ReturnType<typeof companionFile>[]> = {
  root: [companionFile('folder-a', true)],
  'folder-a': [companionFile('a1.txt'), companionFile('a2.txt')],
}

// At the root the only row is folder-a, so the first row checkbox is its checkbox.
const firstRowCheckbox = () =>
  document.querySelector<HTMLInputElement>('li input[type="checkbox"]')!

type Mount = (
  uppy: Uppy<any, any>,
  close: () => void,
) => Promise<LocatorSelectors>

/** Behavioural tests for an example's `<RemoteSource id="Dropbox" close>` component. */
export function describeRemoteSource(mount: Mount) {
  async function setup(restrictions = {}) {
    const uppy = new Uppy({ restrictions }).use(RemoteSources, {
      companionUrl: 'https://companion.test',
      sources: ['Dropbox'],
    })
    const plugin = uppy.getPlugin<UnknownProviderPlugin<any, any>>('Dropbox')!
    // No Companion in tests: serve folder listings from memory.
    plugin.provider.list = (async (path: string | null) => ({
      username: 'test',
      nextPagePath: null,
      items: listings[path ?? 'root'],
    })) as typeof plugin.provider.list
    plugin.setPluginState({ authenticated: true })
    const close = vi.fn()
    const screen = await mount(uppy, close)
    await expect.element(screen.getByText('folder-a')).toBeInTheDocument()
    return { uppy, plugin, close, screen }
  }

  // Leaves folder-a partially selected (a1 checked) and returns to the root.
  async function selectOneFileInFolder(screen: LocatorSelectors) {
    await screen.getByText('folder-a').click()
    await expect.element(screen.getByText('a1.txt')).toBeInTheDocument()
    await userEvent.click(firstRowCheckbox())
    await screen.getByRole('button', { name: 'Dropbox' }).click()
    await expect.poll(() => firstRowCheckbox().indeterminate).toBe(true)
  }

  describe('RemoteSource (stubbed provider)', () => {
    test('folder checkbox indeterminate follows status', async () => {
      const { plugin, screen } = await setup()

      // partial -> unchecked, without clicking the folder checkbox
      await selectOneFileInFolder(screen)
      await screen.getByRole('button', { name: 'Cancel' }).click()
      await expect.poll(() => firstRowCheckbox().indeterminate).toBe(false)

      // partial -> checked, without clicking the folder checkbox
      await selectOneFileInFolder(screen)
      plugin.setPluginState({
        partialTree: plugin
          .getPluginState()
          .partialTree.map((node) =>
            node.type === 'root' ? node : { ...node, status: 'checked' },
          ),
      })
      await expect.poll(() => firstRowCheckbox().indeterminate).toBe(false)
      await expect.poll(() => firstRowCheckbox().checked).toBe(true)
    })

    test('Done keeps the dialog open and shows the error when the folder exceeds the limit', async () => {
      const { uppy, close, screen } = await setup({ maxNumberOfFiles: 1 })
      await userEvent.click(firstRowCheckbox())
      await screen.getByRole('button', { name: 'Done' }).click()
      await expect
        .element(screen.getByText(/You can only upload 1 file/))
        .toBeInTheDocument()
      await expect
        .element(screen.getByRole('button', { name: 'Done' }))
        .toBeDisabled()
      expect(close).not.toHaveBeenCalled()
      expect(uppy.getFiles()).toHaveLength(0)
    })

    test('Done closes the dialog once the files are added', async () => {
      const { uppy, close, screen } = await setup()
      await userEvent.click(firstRowCheckbox())
      await screen.getByRole('button', { name: 'Done' }).click()
      await expect.poll(() => close.mock.calls.length).toBe(1)
      expect(uppy.getFiles()).toHaveLength(2)
    })
  })
}

/** Esc on the native <dialog> must reset the app's modal state, unmounting its content. */
export function describeModalEsc(renderApp: () => Promise<LocatorSelectors>) {
  describe('Modal dialog', () => {
    test('Esc unmounts the modal content', async () => {
      const screen = await renderApp()
      await screen.getByRole('button', { name: 'Webcam', exact: true }).click()
      await expect
        .element(screen.getByRole('heading', { name: 'Camera' }))
        .toBeInTheDocument()
      await userEvent.keyboard('{Escape}')
      await expect
        .poll(() => document.querySelector('dialog')?.open)
        .toBe(false)
      // a closed <dialog> hides its content from role queries, so query the DOM
      await expect.poll(() => document.querySelector('dialog h2')).toBeNull()
    })
  })
}
