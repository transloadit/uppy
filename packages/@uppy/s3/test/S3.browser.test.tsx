import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import { http } from 'msw'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  vi,
} from 'vitest'
import { page, userEvent } from 'vitest/browser'
import '@uppy/core/css/style.css'
import '@uppy/core/provider-views/css/style.css'
import '@uppy/dashboard/css/style.css'
import {
  createMockS3Companion,
  mockGrant,
  toMswHandlers,
} from '../lib/mockCompanion.js'
import S3, { type S3Options } from '../lib/S3.js'
import { it } from './test-extend.js'

const COMPANION = 'http://localhost:3020'
const TOKEN = 'test-auth-token'
const RENAME_LABEL = 'New name, or a path relative to the browsing root:'

const createMockCompanion = () =>
  createMockS3Companion({ token: TOKEN, bucket: 'my-bucket' })
const install = (
  worker: { use: (...handlers: any[]) => void },
  companion: ReturnType<typeof createMockCompanion>,
) => worker.use(...toMswHandlers(companion, COMPANION, { http }))

let uppy: Uppy | undefined

type TestPlugin = S3<Record<string, unknown>, Record<string, never>>

function createUppy(options: Partial<S3Options> = {}) {
  const target = document.createElement('div')
  document.body.appendChild(target)
  uppy = new Uppy().use(Dashboard, { target, inline: true }).use(S3, {
    companionUrl: COMPANION,
    ...options,
  })
  return uppy
}

const pluginOf = (app: Uppy): TestPlugin => {
  const plugin = app.getPlugin<TestPlugin>('S3')
  if (!plugin) throw new Error('Missing S3 plugin')
  return plugin
}

async function openBucket() {
  await page.getByRole('tab', { name: 'S3' }).click()
  await expect.element(page.getByText('readme.md')).toBeVisible()
}

beforeEach(() => {
  document.body.innerHTML = ''
  localStorage.clear()
})

afterEach(() => {
  uppy?.destroy()
  uppy = undefined
})

describe('S3 provider in the browser', () => {
  it('auto-connects and lists the bucket Companion serves', async ({
    worker,
  }) => {
    const companion = createMockCompanion()
    install(worker, companion)
    createUppy()

    await openBucket()
    await expect.element(page.getByText('docs', { exact: true })).toBeVisible()
    // The client cannot pick a bucket: it just asks for a session.
    expect(companion.lastCall('/s3/simple-auth')?.body).toEqual({ form: {} })
    const paths = companion.calls.map((call) => call.path)
    const firstAuth = paths.findIndex((p) => p.endsWith('/s3/simple-auth'))
    const firstList = paths.findIndex((p) => p.includes('/s3/list'))
    expect(firstAuth).toBeGreaterThanOrEqual(0)
    expect(firstList).toBeGreaterThan(firstAuth)
    expect(companion.calls.filter((call) => call.status === 401)).toEqual([])
  })

  it('reuses a stored session instead of connecting again', async ({
    worker,
  }) => {
    localStorage.setItem('companion-S3-auth-token', TOKEN)
    const companion = createMockCompanion()
    install(worker, companion)
    createUppy()

    await openBucket()
    expect(companion.lastCall('/s3/simple-auth')).toBeUndefined()
    expect(companion.calls.every((call) => call.token === TOKEN)).toBe(true)
  })

  it('pins a queued import URL to the bucket where the file was selected', async ({
    worker,
  }) => {
    install(worker, createMockCompanion())
    const app = createUppy()
    await openBucket()
    const plugin = pluginOf(app)
    const queuedUrl = new URL(plugin.provider.fileUrl('readme.md'))
    expect(queuedUrl.searchParams.get('bucket')).toBe('my-bucket')
    // The queued URL keeps its bucket; a new session has to browse again
    // before it may hand out one, so a key can never be reinterpreted in
    // whatever bucket the next session happens to see.
    await plugin.view.logout()
    expect(() => plugin.provider.fileUrl('readme.md')).toThrow(
      'Browse the storage folder',
    )
    expect(queuedUrl.searchParams.get('bucket')).toBe('my-bucket')
  })

  it('opens a folder beyond the first listing page', async ({ worker }) => {
    const companion = createMockS3Companion({
      token: TOKEN,
      pageSize: 1,
      folders: {
        '': [
          { name: 'readme.md', isFolder: false },
          { name: 'docs', isFolder: true },
        ],
        'docs/': [],
      },
    })
    install(worker, companion)
    const plugin = pluginOf(createUppy())
    expect(await plugin.openFolderPath('docs/')).toBe(true)
    expect(plugin.getPluginState().currentFolderId).toBe('docs%2F')
  })

  it('normalizes grant roots before deriving customer paths', async ({
    worker,
  }) => {
    install(worker, createMockCompanion())
    const plugin = pluginOf(
      createUppy({
        getGrant: async () =>
          mockGrant({ bucket: 'my-bucket', prefix: '/tenant' }),
      }),
    )
    await plugin.openFolderPath('')
    expect(plugin.rootPrefix).toBe('tenant/')
  })

  it('forgets the session on logout', async ({ worker }) => {
    install(worker, createMockCompanion())
    const plugin = pluginOf(
      createUppy({
        getGrant: async () =>
          mockGrant({ bucket: 'my-bucket', prefix: 'tenant/' }),
      }),
    )
    await plugin.openFolderPath('')
    expect(plugin.rootPrefix).toBe('tenant/')
    expect(plugin.canWrite).toBe(true)
    await plugin.view.logout()
    expect(plugin.rootPrefix).toBe('')
    expect(plugin.canWrite).toBe(false)
  })

  it('keeps a cancelled rename from discarding its listing', async ({
    worker,
  }) => {
    install(worker, createMockCompanion())
    const app = createUppy()
    await openBucket()
    const plugin = pluginOf(app)
    const item = plugin
      .getPluginState()
      .partialTree.find((entry) => entry.id === 'readme.md')
    if (!item || item.type !== 'file') throw new Error('Missing readme')
    vi.spyOn(plugin.view, 'prompt').mockResolvedValue(null)
    const refresh = vi.spyOn(plugin.view, 'refreshCurrentFolder')
    const rename = plugin
      .builtInActions()
      .find((action) => action.id === 's3:rename')
    if (!rename) throw new Error('Missing rename action')
    await plugin.view.runAction(rename, item)
    expect(refresh).not.toHaveBeenCalled()
  })

  it('hides write actions when Companion reports a read-only session', async ({
    worker,
  }) => {
    const companion = createMockS3Companion({
      token: TOKEN,
      bucket: 'my-bucket',
      canWrite: false,
    })
    install(worker, companion)
    const app = createUppy()
    await openBucket()
    const plugin = pluginOf(app)
    expect(plugin.canWrite).toBe(false)
    expect(plugin.builtInActions()).toEqual([])
    await expect
      .element(page.getByRole('button', { name: 'New folder', exact: true }))
      .not.toBeInTheDocument()
  })

  it('replaces an open prompt without keeping its previous input', async ({
    worker,
  }) => {
    install(worker, createMockCompanion())
    const app = createUppy()
    await openBucket()
    const { view } = pluginOf(app)
    const first = view.prompt({ title: 'First name', defaultValue: 'old.txt' })
    await expect
      .element(
        page.getByRole('dialog', { name: 'First name' }).getByRole('textbox'),
      )
      .toHaveValue('old.txt')
    const second = view.prompt({
      title: 'Second name',
      defaultValue: 'new.txt',
    })
    await expect(first).resolves.toBeNull()
    await expect
      .element(
        page.getByRole('dialog', { name: 'Second name' }).getByRole('textbox'),
      )
      .toHaveValue('new.txt')
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Cancel' })
      .click()
    await expect(second).resolves.toBeNull()
  })

  it('keeps application metadata and response types in action callbacks', () => {
    const options: S3Options<{ caption: string }, { assetId: string }> = {
      companionUrl: COMPANION,
      actions: [
        {
          id: 'typed',
          label: 'Typed',
          run: ({ uppy: app }) => {
            expectTypeOf(
              app.getFile('file').meta.caption,
            ).toEqualTypeOf<string>()
            expectTypeOf(
              app.getFile('file').response?.body?.assetId,
            ).toEqualTypeOf<string | undefined>()
          },
        },
      ],
    }
    expect(options.actions).toHaveLength(1)
  })

  it('the mock preserves a same-named folder when deleting a file', async ({
    worker,
  }) => {
    const companion = createMockS3Companion({
      token: TOKEN,
      bucket: 'my-bucket',
      folders: {
        '': [
          { name: 'readme.md', isFolder: false },
          { name: 'docs', isFolder: false },
          { name: 'docs', isFolder: true },
        ],
        'docs/': [],
      },
    })
    install(worker, companion)
    const app = createUppy()
    await openBucket()
    const plugin = pluginOf(app)
    await plugin.provider.deleteItem('docs')
    expect(companion.folders.get('')).toEqual([
      { name: 'readme.md', isFolder: false },
      { name: 'docs', isFolder: true },
    ])
  })

  it('restores a session scoped to a prefix and opens its nested folder', async ({
    worker,
  }) => {
    const companion = createMockS3Companion({
      token: TOKEN,
      bucket: 'my-bucket',
      // Companion confines this session to a prefix and reports it in the
      // listing; the client never asks for one.
      prefix: 'tenant/',
      folders: {
        'tenant/': [{ name: 'photos', isFolder: true }],
        'tenant/photos/': [],
      },
    })
    install(worker, companion)
    const plugin = pluginOf(createUppy({ autoConnect: false }))
    await plugin.view.handleAuth({})
    expect(plugin.rootPrefix).toBe('tenant/')
    expect(await plugin.openFolderPath('tenant/photos/')).toBe(true)
    expect(plugin.getPluginState().currentFolderId).toBe('tenant%2Fphotos%2F')
    expect(await plugin.openFolderPath('outside/')).toBe(false)
  })

  it('opens a headless folder without waiting for a panel to start the listing', async ({
    worker,
  }) => {
    const companion = createMockCompanion()
    install(worker, companion)
    uppy = new Uppy().use(S3, { companionUrl: COMPANION })
    const plugin = pluginOf(uppy)
    const started = performance.now()
    expect(await plugin.openFolderPath('docs/')).toBe(true)
    expect(performance.now() - started).toBeLessThan(2000)
    expect(plugin.getPluginState().currentFolderId).toBe('docs%2F')
  }, 20000)

  it('bulk actions receive only topmost selected entries and refresh after partial failure', async ({
    worker,
  }) => {
    const companion = createMockCompanion()
    install(worker, companion)
    const app = createUppy({ mode: 'manager' })
    await openBucket()
    const plugin = pluginOf(app)
    await plugin.view.openFolder('docs%2F')
    await plugin.view.openFolder(null)
    const folder = plugin
      .getPluginState()
      .partialTree.find((node) => node.id === 'docs%2F')
    if (!folder || folder.type !== 'folder')
      throw new Error('Missing docs folder')
    plugin.view.toggleCheckbox(folder, false)
    const selections: string[][] = []
    await plugin.view.runBulkAction({
      id: 'test:partial',
      label: 'Move',
      run: async ({ items }) => {
        selections.push(items.map((item) => item.id))
        companion.folders
          .get('docs/')
          ?.push({ name: 'added.txt', isFolder: false })
        throw new Error('Expected partial mutation failure')
      },
    })
    expect(selections).toEqual([['docs%2F']])
    await plugin.view.openFolder('docs%2F')
    await expect
      .element(page.getByText('added.txt', { exact: true }))
      .toBeVisible()
  })

  it('selecting the only child never makes its propagated parent a mutation target', async ({
    worker,
  }) => {
    const companion = createMockCompanion()
    install(worker, companion)
    const app = createUppy({ mode: 'manager' })
    await openBucket()
    const plugin = pluginOf(app)
    await plugin.view.openFolder('docs%2F')
    const file = plugin
      .getPluginState()
      .partialTree.find((node) => node.id === 'docs%2Fhello.txt')
    if (!file || file.type !== 'file') throw new Error('Missing hello.txt')
    plugin.view.toggleCheckbox(file, false)
    companion.folders
      .get('docs/')
      ?.push({ name: 'new-unselected.txt', isFolder: false })
    await plugin.refreshListing()
    const run = vi.fn(async () => {})
    await plugin.view.runBulkAction({
      id: 'test:selection',
      label: 'Move',
      refresh: false,
      run,
    })
    expect(run).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [expect.objectContaining({ id: 'docs%2Fhello.txt' })],
      }),
    )
  })

  it('resolves typed move destinations relative to the granted root', async ({
    worker,
  }) => {
    const companion = createMockS3Companion({
      token: TOKEN,
      bucket: 'my-bucket',
      folders: {
        'tenant/': [
          { name: 'photo.jpg', isFolder: false },
          { name: 'archive', isFolder: true },
        ],
        'tenant/archive/': [],
      },
    })
    install(worker, companion)
    const plugin = pluginOf(
      createUppy({
        getGrant: async () =>
          mockGrant({ bucket: 'my-bucket', prefix: 'tenant/' }),
      }),
    )
    await page.getByRole('tab', { name: 'S3' }).click()
    await page.getByRole('button', { name: 'Actions for photo.jpg' }).click()
    await page.getByRole('menuitem', { name: 'Rename / move…' }).click()
    await page
      .getByRole('dialog')
      .getByRole('textbox')
      .fill('archive/photo.jpg')
    await page.getByRole('button', { name: 'Rename', exact: true }).click()
    await expect
      .poll(() => companion.lastCall('/s3/mutate/move')?.body)
      .toEqual({
        id: 'tenant/photo.jpg',
        destination: 'tenant/archive/photo.jpg',
      })
    // Wait for the refresh the move triggers, so nothing is in flight after.
    await expect
      .poll(() => plugin.getPluginState().partialTree.map((node) => node.id))
      .not.toContain('tenant%2Fphoto.jpg')
    await expect.poll(() => plugin.getPluginState().loading).toBeFalsy()
  })

  it('shows plain chrome when standalone', async ({ worker }) => {
    const companion = createMockCompanion()
    install(worker, companion)
    createUppy({ standalone: true })
    await openBucket()

    const panel = page.getByRole('tabpanel')
    // The page around the plugin owns the heading and the session.
    await expect
      .element(panel.getByRole('heading', { level: 1 }))
      .not.toBeInTheDocument()
    await expect
      .element(panel.getByRole('button', { name: 'Cancel' }))
      .not.toBeInTheDocument()
    await expect
      .element(panel.getByRole('button', { name: 'Log out' }))
      .not.toBeInTheDocument()
    await expect
      .element(panel.getByRole('button', { name: 'New folder' }))
      .toBeVisible()
  })

  it('opens one item menu at a time and closes it with Escape', async ({
    worker,
  }) => {
    const companion = createMockCompanion()
    install(worker, companion)
    createUppy()
    await openBucket()

    await page.getByRole('button', { name: 'Actions for readme.md' }).click()
    await expect
      .element(page.getByRole('menu', { name: 'Actions for readme.md' }))
      .toBeVisible()

    await page.getByRole('button', { name: 'Actions for docs' }).click()
    await expect
      .element(page.getByRole('menu', { name: 'Actions for docs' }))
      .toBeVisible()
    expect(document.querySelectorAll('[role="menu"]')).toHaveLength(1)

    await userEvent.keyboard('{Escape}')
    await expect.element(page.getByRole('menu')).not.toBeInTheDocument()
    // Focus went back to the trigger
    expect(document.activeElement?.getAttribute('aria-label')).toBe(
      'Actions for docs',
    )
  })

  it('closes the item detail dialog with Escape without closing the Dashboard modal', async ({
    worker,
  }) => {
    const companion = createMockCompanion()
    install(worker, companion)
    uppy = new Uppy()
      .use(Dashboard, { inline: false })
      .use(S3, { companionUrl: COMPANION, mode: 'manager' })
    const dashboard = uppy.getPlugin<Dashboard<any, any>>('Dashboard')
    if (!dashboard) throw new Error('Missing Dashboard plugin')
    // The close is animated, so watch for the request rather than the state.
    const modalClosed = vi.fn()
    uppy.on('dashboard:modal-closed', modalClosed)
    dashboard.openModal()
    await openBucket()
    const plugin = pluginOf(uppy)
    const file = plugin
      .getPluginState()
      .partialTree.find(
        (node) => node.type === 'file' && node.data.name === 'readme.md',
      )
    if (!file || file.type !== 'file') throw new Error('Missing readme.md')
    plugin.view.openItemDetail(file)
    await expect
      .element(page.getByRole('dialog', { name: 'readme.md' }))
      .toBeVisible()

    await userEvent.keyboard('{Escape}')
    await expect
      .element(page.getByRole('dialog', { name: 'readme.md' }))
      .not.toBeInTheDocument()
    // The same key press must not fall through to the Dashboard's own Escape handler.
    expect(modalClosed).not.toHaveBeenCalled()
  })

  it('creates a folder through the inline dialog and refreshes the listing', async ({
    worker,
  }) => {
    const companion = createMockCompanion()
    install(worker, companion)
    createUppy()
    await openBucket()

    await page.getByRole('button', { name: 'New folder' }).click()
    await expect.element(page.getByRole('dialog')).toBeVisible()
    await page.getByLabelText('Name of the new folder:').fill('reports')
    await userEvent.keyboard('{Enter}')

    await expect
      .element(page.getByText('reports', { exact: true }))
      .toBeVisible()
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()
    expect(companion.lastCall('/s3/mutate/create-folder')?.body).toEqual({
      parentId: null,
      name: 'reports',
    })
    // Toasts go through the Dashboard Informer (which the Dashboard renders twice)
    await expect
      .element(page.getByText(/Created folder "reports"/).first())
      .toBeVisible()
  })

  it('renames in place and moves with a path', async ({ worker }) => {
    const companion = createMockCompanion()
    install(worker, companion)
    createUppy()
    await openBucket()

    // Bare name → rename in the current folder
    await page.getByRole('button', { name: 'Actions for readme.md' }).click()
    await page.getByRole('menuitem', { name: 'Rename / move…' }).click()
    const input = page.getByLabelText(RENAME_LABEL)
    await expect.element(input).toHaveValue('readme.md')
    await input.fill('notes.md')
    await page.getByRole('button', { name: 'Rename', exact: true }).click()
    await expect.element(page.getByText('notes.md')).toBeVisible()
    expect(companion.lastCall('/s3/mutate/move')?.body).toEqual({
      id: 'readme.md',
      destination: 'notes.md',
    })

    // A path moves the file
    await page.getByRole('button', { name: 'Actions for notes.md' }).click()
    await page.getByRole('menuitem', { name: 'Rename / move…' }).click()
    await input.fill('docs/notes.md')
    await userEvent.keyboard('{Enter}')
    // The list hides behind the progress screen while the move runs, so wait
    // for the request itself rather than for the row to disappear.
    await expect
      .poll(() => companion.lastCall('/s3/mutate/move')?.body)
      .toEqual({ id: 'notes.md', destination: 'docs/notes.md' })
    await expect
      .element(page.getByText('notes.md', { exact: true }))
      .not.toBeInTheDocument()
  })

  it('renames a folder by moving its contents one by one', async ({
    worker,
  }) => {
    const companion = createMockCompanion()
    install(worker, companion)
    createUppy()
    await openBucket()

    await page.getByRole('button', { name: 'Actions for docs' }).click()
    await page.getByRole('menuitem', { name: 'Rename / move…' }).click()
    await page.getByLabelText(RENAME_LABEL).fill('archive')
    await userEvent.keyboard('{Enter}')

    await expect
      .element(page.getByText('archive', { exact: true }))
      .toBeVisible()
    await expect
      .element(page.getByText('docs', { exact: true }))
      .not.toBeInTheDocument()
    // Companion only ever moved files; the folders were created and deleted.
    expect(
      companion.calls
        .filter((call) => call.path.endsWith('/s3/mutate/move'))
        .map((call) => call.body),
    ).toEqual([{ id: 'docs/hello.txt', destination: 'archive/hello.txt' }])
    expect(companion.folders.get('archive/')).toEqual([
      { name: 'hello.txt', isFolder: false, size: 12, mimeType: 'text/plain' },
    ])
    expect(companion.folders.has('docs/')).toBe(false)
    await expect
      .element(page.getByText(/Renamed to "archive"/).first())
      .toBeVisible()
  })

  it('refuses to move a folder into itself', async ({ worker }) => {
    const companion = createMockCompanion()
    install(worker, companion)
    createUppy()
    await openBucket()

    await page.getByRole('button', { name: 'Actions for docs' }).click()
    await page.getByRole('menuitem', { name: 'Rename / move…' }).click()
    await page.getByLabelText(RENAME_LABEL).fill('docs/inner')
    await userEvent.keyboard('{Enter}')

    await expect
      .element(page.getByText('A folder cannot be moved into itself').first())
      .toBeVisible()
    expect(companion.lastCall('/s3/mutate/move')).toBeUndefined()
    expect(companion.lastCall('/s3/mutate/create-folder')).toBeUndefined()
  })

  it('deletes files after confirmation and folders with their contents', async ({
    worker,
  }) => {
    const companion = createMockCompanion()
    install(worker, companion)
    createUppy()
    await openBucket()

    // Cancel leaves everything alone
    await page.getByRole('button', { name: 'Actions for readme.md' }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    const dialog = page.getByRole('dialog')
    await expect.element(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect.element(dialog).not.toBeInTheDocument()
    expect(companion.lastCall('/s3/mutate/delete')).toBeUndefined()

    // Confirm deletes the file and says so. (`exact`, because the toast text
    // contains the file name too.)
    await page.getByRole('button', { name: 'Actions for readme.md' }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()
    // (The loading screen hides the list while the request is in flight, so
    // wait for the toast before looking at the calls.)
    await expect
      .element(page.getByText(/Deleted "readme.md"/).first())
      .toBeVisible()
    expect(companion.lastCall('/s3/mutate/delete')?.body).toEqual({
      id: 'readme.md',
    })
    await expect
      .element(page.getByText('readme.md', { exact: true }))
      .not.toBeInTheDocument()

    // A folder is emptied first (Companion only deletes empty folders), then
    // deleted itself.
    await page.getByRole('button', { name: 'Actions for docs' }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    await expect
      .element(
        dialog.getByText('The folder and everything in it will be deleted.'),
      )
      .toBeVisible()
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect.element(page.getByText(/Deleted "docs"/).first()).toBeVisible()
    await expect
      .element(page.getByText('docs', { exact: true }))
      .not.toBeInTheDocument()
    expect(
      companion.calls
        .filter((call) => call.path === '/s3/mutate/delete')
        .slice(1)
        .map((call) => call.body),
    ).toEqual([{ id: 'docs/hello.txt' }, { id: 'docs/' }])
    expect(companion.folders.has('docs/')).toBe(false)
  })

  it('offers the bulk actions in the header while items are checked (picker mode)', async ({
    worker,
  }) => {
    const companion = createMockCompanion()
    install(worker, companion)
    createUppy()
    await openBucket()

    const deleteButton = page.getByRole('button', {
      name: 'Delete',
      exact: true,
    })
    await expect.element(deleteButton).not.toBeInTheDocument()

    await page.getByRole('checkbox', { name: /docs/ }).click()
    await page.getByRole('checkbox', { name: 'readme.md' }).click()
    await expect.element(deleteButton).toBeVisible()
    await expect
      .element(page.getByRole('button', { name: 'Move…' }))
      .toBeVisible()

    await deleteButton.click()
    const dialog = page.getByRole('dialog')
    await expect.element(dialog.getByText('Delete 2 items?')).toBeVisible()
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect
      .element(page.getByText(/Deleted 2 items/).first())
      .toBeVisible()
    await expect
      .element(page.getByText('readme.md', { exact: true }))
      .not.toBeInTheDocument()
    expect(
      companion.calls
        .filter((call) => call.path === '/s3/mutate/delete')
        .map((call) => call.body),
    ).toEqual([{ id: 'docs/hello.txt' }, { id: 'docs/' }, { id: 'readme.md' }])
    await expect.element(deleteButton).not.toBeInTheDocument()
  })

  describe('server-issued grants', () => {
    it('connects with a grant instead of a plain session', async ({
      worker,
    }) => {
      const companion = createMockCompanion()
      install(worker, companion)
      const grant = mockGrant({ bucket: 'my-bucket' })
      const getGrant = vi.fn(async () => grant)
      createUppy({ getGrant })

      await openBucket()
      expect(getGrant).toHaveBeenCalledTimes(1)
      expect(companion.lastCall('/s3/simple-auth')?.body).toEqual({
        form: { grant },
      })
      const paths = companion.calls.map((call) => call.path)
      const firstAuth = paths.findIndex((p) => p.endsWith('/s3/simple-auth'))
      const firstList = paths.findIndex((p) => p.includes('/s3/list'))
      expect(firstAuth).toBeGreaterThanOrEqual(0)
      expect(firstList).toBeGreaterThan(firstAuth)
      expect(companion.calls.filter((call) => call.status === 401)).toEqual([])
      expect(companion.session).toMatchObject({ bucket: 'my-bucket' })
      // Mutations are available: the grant carries the write scope.
      await expect
        .element(page.getByRole('button', { name: 'New folder' }))
        .toBeVisible()
    })

    it('does not restore a session when a pending grant resolves after logout', async ({
      worker,
    }) => {
      let now = Math.floor(Date.now() / 1000)
      const companion = createMockS3Companion({
        token: TOKEN,
        nowSeconds: () => now,
      })
      install(worker, companion)
      let finishRenewal: ((grant: string) => void) | undefined
      const getGrant = vi
        .fn<() => Promise<string>>()
        .mockResolvedValueOnce(
          mockGrant({ bucket: 'my-bucket', exp: now + 900 }),
        )
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              finishRenewal = resolve
            }),
        )
      const app = createUppy({ getGrant })
      await openBucket()
      const plugin = pluginOf(app)
      now += 901
      const request = plugin.provider
        .list(null, { signal: new AbortController().signal })
        .then(
          (result) => ({ result }),
          (error: unknown) => ({ error }),
        )
      await vi.waitFor(() => expect(getGrant).toHaveBeenCalledTimes(2))
      await plugin.view.logout()
      if (!finishRenewal) throw new Error('Renewal did not start')
      finishRenewal(mockGrant({ bucket: 'my-bucket', exp: now + 900 }))
      expect(await request).toHaveProperty('error')
      expect(await plugin.storage.getItem(plugin.provider.tokenKey)).toBeNull()
      expect(plugin.getPluginState().authenticated).toBe(false)
      expect(
        companion.calls.filter((call) => call.path.endsWith('/simple-auth')),
      ).toHaveLength(1)
    })

    it('shares renewal across concurrent expired requests and does not inherit a caller abort', async ({
      worker,
    }) => {
      let now = Math.floor(Date.now() / 1000)
      const companion = createMockS3Companion({
        token: TOKEN,
        nowSeconds: () => now,
      })
      install(worker, companion)
      const shortLived = mockGrant({ bucket: 'my-bucket', exp: now + 900 })
      let finishRenewal: ((grant: string) => void) | undefined
      const getGrant = vi
        .fn<() => Promise<string>>()
        .mockResolvedValueOnce(shortLived)
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              finishRenewal = resolve
            }),
        )
      const app = createUppy({ getGrant })
      await openBucket()
      now += 901
      const plugin = pluginOf(app)
      const canceled = new AbortController()
      const first = plugin.provider
        .list(null, { signal: canceled.signal })
        .catch((error: unknown) => error)
      await vi.waitFor(() => expect(getGrant).toHaveBeenCalledTimes(2))
      const second = plugin.provider.list(null, {
        signal: new AbortController().signal,
      })
      // Attach rejection handling immediately: a broken concurrent renewal must not be unhandled.
      const secondResult = second.then(
        (result) => ({ result }),
        (error: unknown) => ({ error }),
      )
      await vi.waitFor(() =>
        expect(
          companion.calls.filter((call) => call.status === 401),
        ).toHaveLength(2),
      )
      canceled.abort()
      if (!finishRenewal) throw new Error('Renewal did not start')
      finishRenewal(mockGrant({ bucket: 'my-bucket', exp: now + 900 }))
      await first
      expect(await secondResult).toHaveProperty('result')
      expect(getGrant).toHaveBeenCalledTimes(2)
    })

    it('fetches a new grant when the session expires mid-way', async ({
      worker,
    }) => {
      let now = Math.floor(Date.now() / 1000)
      const companion = createMockS3Companion({
        token: TOKEN,
        nowSeconds: () => now,
      })
      install(worker, companion)
      const shortLived = mockGrant({ bucket: 'my-bucket', exp: now + 900 })
      const getGrant = vi
        .fn<() => Promise<string>>()
        .mockResolvedValueOnce(shortLived)
        .mockImplementation(async () =>
          mockGrant({ bucket: 'my-bucket', exp: now + 900 }),
        )
      createUppy({ getGrant })

      await openBucket()
      now += 901
      // The next listing hits an expired session: one re-grant, then it succeeds.
      await page.getByText('docs', { exact: true }).click()
      await expect.element(page.getByText('hello.txt')).toBeVisible()
      expect(getGrant).toHaveBeenCalledTimes(2)
      expect(
        companion.calls.filter((call) => call.path.endsWith('/s3/simple-auth')),
      ).toHaveLength(2)
    })

    it('hides the mutation actions for a read-only grant', async ({
      worker,
    }) => {
      const companion = createMockCompanion()
      install(worker, companion)
      createUppy({
        getGrant: async () =>
          mockGrant({ bucket: 'my-bucket', scopes: ['read'] }),
      })

      await openBucket()
      expect(companion.session?.scopes).toEqual(['read'])
      await expect
        .element(page.getByRole('button', { name: 'New folder' }))
        .not.toBeInTheDocument()
      await expect
        .element(page.getByRole('button', { name: 'Actions for readme.md' }))
        .not.toBeInTheDocument()
    })
  })
})
