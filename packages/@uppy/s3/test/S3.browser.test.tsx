import Uppy, { BasePlugin, type PluginOpts } from '@uppy/core'
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
import TransloaditStorage from '../../transloadit-storage/lib/TransloaditStorage.js'
import {
  createMockS3Companion,
  handleFetchRequest,
  mockGrant,
  toMswHandlers,
} from '../lib/mockCompanion.js'
import S3, { type S3Options } from '../lib/S3.js'
import { it } from './test-extend.js'

const COMPANION = 'http://localhost:3020'
const TOKEN = 'test-auth-token'

const createMockCompanion = () =>
  createMockS3Companion({ token: TOKEN, bucket: 'my-bucket' })
const install = (
  worker: { use: (...handlers: any[]) => void },
  companion: ReturnType<typeof createMockCompanion>,
) => worker.use(...toMswHandlers(companion, COMPANION, { http }))

let uppy: Uppy | undefined

class FixtureUploader extends BasePlugin<
  PluginOpts & { assemblyOptions?: unknown; waitForEncoding?: boolean },
  Record<string, unknown>,
  Record<string, never>
> {
  constructor(app: Uppy, options: PluginOpts & { assemblyOptions?: unknown }) {
    super(app, options)
    this.id = options.id ?? 'Transloadit'
    this.type = 'uploader'
  }
}

function createUppy(options: Partial<S3Options> = {}) {
  const target = document.createElement('div')
  document.body.appendChild(target)
  uppy = new Uppy().use(Dashboard, { target, inline: true }).use(S3, {
    companionUrl: COMPANION,
    bucket: 'my-bucket',
    ...options,
  })
  return uppy
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
    const app = createUppy()
    const plugin =
      app.getPlugin<S3<Record<string, unknown>, Record<string, never>>>('S3')!
    expect(await plugin.openFolderPath('docs/')).toBe(true)
    expect(plugin.getPluginState().currentFolderId).toBe('docs%2F')
  })

  it('normalizes grant roots before deriving customer paths', async ({
    worker,
  }) => {
    install(worker, createMockCompanion())
    const app = createUppy({
      getGrant: async () =>
        mockGrant({ bucket: 'my-bucket', prefix: '/tenant' }),
    })
    const plugin =
      app.getPlugin<S3<Record<string, unknown>, Record<string, never>>>('S3')!
    await plugin.openFolderPath('')
    expect(plugin.rootPrefix).toBe('tenant/')
  })

  it('keeps a cancelled rename from discarding its listing', async ({
    worker,
  }) => {
    install(worker, createMockCompanion())
    const app = createUppy()
    await openBucket()
    const plugin =
      app.getPlugin<S3<Record<string, unknown>, Record<string, never>>>('S3')!
    const item = plugin
      .getPluginState()
      .partialTree.find((entry) => entry.id === 'readme.md')
    if (!item || item.type !== 'file') throw new Error('Missing readme')
    vi.spyOn(plugin.view, 'prompt').mockResolvedValue(null)
    const refresh = vi.spyOn(plugin.view, 'refreshCurrentFolder')
    const rename = plugin
      .builtInActions()
      .find((action) => action.id === 's3:rename')!
    await plugin.view.runAction(rename, item)
    expect(refresh).not.toHaveBeenCalled()
  })

  it('offers the custom upload action without replacing an application Assembly', () => {
    const onUploadRequest = vi.fn()
    uppy = new Uppy().use(TransloaditStorage, {
      workspace: 'my-bucket',
      companionUrl: COMPANION,
      onUploadRequest,
    })
    const plugin =
      uppy.getPlugin<
        TransloaditStorage<Record<string, unknown>, Record<string, never>>
      >('TransloaditStorage')!
    expect(plugin.builtInToolbarActions().map((action) => action.id)).toContain(
      'transloadit:uploadFiles',
    )
  })

  it('hides write actions when Companion reports a read-only bucket', async ({
    worker,
  }) => {
    const companion = createMockS3Companion({
      token: TOKEN,
      bucket: 'my-bucket',
      canMutate: false,
    })
    install(worker, companion)
    const app = createUppy()
    await openBucket()
    const plugin =
      app.getPlugin<S3<Record<string, unknown>, Record<string, never>>>('S3')!
    expect(plugin.canMutate).toBe(false)
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
    const view =
      app.getPlugin<S3<Record<string, unknown>, Record<string, never>>>(
        'S3',
      )!.view
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
    const plugin =
      app.getPlugin<S3<Record<string, unknown>, Record<string, never>>>('S3')
    if (!plugin) throw new Error('Missing S3 plugin')
    await plugin.provider.deleteItem('docs')
    expect(companion.folders.get('')).toEqual([
      { name: 'readme.md', isFolder: false },
      { name: 'docs', isFolder: true },
    ])
  })
  it('restores a scoped bucket session and opens its existing nested folder', async ({
    worker,
  }) => {
    const companion = createMockS3Companion({
      token: TOKEN,
      bucket: 'my-bucket',
      folders: {
        'tenant/': [{ name: 'photos', isFolder: true }],
        'tenant/photos/': [],
      },
    })
    install(worker, companion)
    const app = createUppy({ bucket: undefined, autoConnect: false })
    const plugin =
      app.getPlugin<S3<Record<string, unknown>, Record<string, never>>>('S3')
    if (!plugin) throw new Error('Missing S3 plugin')
    await plugin.view.handleAuth({ bucket: 'my-bucket/tenant/' })
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
    uppy = new Uppy().use(S3, { companionUrl: COMPANION, bucket: 'my-bucket' })
    const plugin =
      uppy.getPlugin<S3<Record<string, unknown>, Record<string, never>>>('S3')
    if (!plugin) throw new Error('Missing S3 plugin')
    const started = performance.now()
    expect(await plugin.openFolderPath('docs/')).toBe(true)
    expect(performance.now() - started).toBeLessThan(2000)
    expect(plugin.getPluginState().currentFolderId).toBe('docs%2F')
  }, 20000)
  it('storeUploads refuses to overwrite explicit Assembly configuration', () => {
    const assemblyOptions = { params: { template_id: 'owned-template' } }
    uppy = new Uppy().use(FixtureUploader, { assemblyOptions })
    expect(() =>
      uppy?.use(TransloaditStorage, {
        workspace: 'my-bucket',
        companionUrl: COMPANION,
        storeUploads: {
          signAssembly: async (params) => ({ params, signature: 'test' }),
        },
      }),
    ).toThrow('createStoreAssemblyOptions')
    expect(
      uppy.getPlugin<FixtureUploader>('Transloadit')?.opts.assemblyOptions,
    ).toBe(assemblyOptions)
  })
  it('storeUploads targets a custom uploader ID and preserves its locale', () => {
    const uploaderLocale = {
      strings: { encoding: 'My processing label', custom: 'Keep me' },
    }
    uppy = new Uppy().use(FixtureUploader, {
      id: 'WeddingUpload',
      locale: uploaderLocale,
    })
    uppy.use(TransloaditStorage, {
      workspace: 'my-bucket',
      companionUrl: COMPANION,
      storeUploads: {
        transloaditPluginId: 'WeddingUpload',
        signAssembly: async (params) => ({ params, signature: 'test' }),
      },
    })
    const uploader = uppy.getPlugin<FixtureUploader>('WeddingUpload')
    expect(uploader?.opts.assemblyOptions).toBeTypeOf('function')
    expect(uploader?.opts.waitForEncoding).toBe(true)
    expect(uploader?.opts.locale).toEqual(uploaderLocale)
  })
  it('bulk actions receive only topmost selected entries and refresh after partial failure', async ({
    worker,
  }) => {
    const companion = createMockCompanion()
    install(worker, companion)
    const app = createUppy({ mode: 'manager' })
    await openBucket()
    const plugin =
      app.getPlugin<S3<Record<string, unknown>, Record<string, never>>>('S3')
    if (!plugin) throw new Error('Missing S3 plugin')
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
    const plugin =
      app.getPlugin<S3<Record<string, unknown>, Record<string, never>>>('S3')
    if (!plugin) throw new Error('Missing S3 plugin')
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
  it('Storage uses its own provider and keeps original downloads available to read-only users', async ({
    worker,
  }) => {
    const companion = createMockCompanion()
    const nativeCompanion = {
      ...companion,
      handle: (request: Parameters<typeof companion.handle>[0]) =>
        companion.handle({
          ...request,
          url: request.url.replace('/transloadit-storage/', '/s3/'),
        }),
    }
    worker.use(
      http.all(
        `${COMPANION}/transloadit-storage/*`,
        async ({ request }) =>
          (await handleFetchRequest(nativeCompanion, request)) ?? undefined,
      ),
    )
    const target = document.createElement('div')
    document.body.appendChild(target)
    const getDownloadUrl = vi.fn(async () => '/authorized-original/readme')
    uppy = new Uppy()
      .use(Dashboard, { target, inline: true })
      .use(TransloaditStorage, {
        companionUrl: COMPANION,
        workspace: 'my-bucket',
        getGrant: async () =>
          mockGrant({ bucket: 'my-bucket', scopes: ['read'] }),
        getDownloadUrl,
      })
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await expect.element(page.getByText('readme.md')).toBeVisible()
    await page.getByRole('button', { name: 'Actions for readme.md' }).click()
    await expect
      .element(page.getByRole('menuitem', { name: 'Rename / move…' }))
      .not.toBeInTheDocument()
    await expect
      .element(page.getByRole('menuitem', { name: 'Download', exact: true }))
      .toBeVisible()
    const downloads: string[] = []
    const capture = (event: MouseEvent) => {
      if (event.target instanceof HTMLAnchorElement) {
        event.preventDefault()
        downloads.push(event.target.href)
      }
    }
    document.addEventListener('click', capture, true)
    try {
      await page
        .getByRole('menuitem', { name: 'Download', exact: true })
        .click()
      await expect
        .poll(() => downloads)
        .toEqual([new URL('/authorized-original/readme', location.href).href])
      expect(getDownloadUrl).toHaveBeenCalledWith('readme.md')
    } finally {
      document.removeEventListener('click', capture, true)
    }
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
    createUppy({
      bucket: undefined,
      getGrant: async () =>
        mockGrant({ bucket: 'my-bucket', prefix: 'tenant/' }),
    })
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
  })
  it('auto-connects to the configured bucket and lists it', async ({
    worker,
  }) => {
    const companion = createMockCompanion()
    install(worker, companion)
    createUppy()

    await openBucket()
    await expect.element(page.getByText('docs', { exact: true })).toBeVisible()
    expect(companion.lastCall('/s3/simple-auth')?.body).toEqual({
      form: { bucket: 'my-bucket' },
    })
    expect(localStorage.getItem('companion-S3-s3-bucket')).toBe('my-bucket')
    const paths = companion.calls.map((call) => call.path)
    const firstAuth = paths.findIndex((p) => p.endsWith('/s3/simple-auth'))
    const firstList = paths.findIndex((p) => p.includes('/s3/list'))
    expect(firstAuth).toBeGreaterThanOrEqual(0)
    expect(firstList).toBeGreaterThan(firstAuth)
    expect(companion.calls.filter((call) => call.status === 401)).toEqual([])
  })

  it('reconnects when the stored session belongs to another bucket', async ({
    worker,
  }) => {
    localStorage.setItem('companion-S3-auth-token', 'stale-token')
    localStorage.setItem('companion-S3-s3-bucket', 'other-bucket')
    const companion = createMockCompanion()
    install(worker, companion)
    createUppy()

    await openBucket()
    expect(companion.calls.some((call) => call.token === 'stale-token')).toBe(
      false,
    )
    expect(companion.lastCall('/s3/simple-auth')?.body).toEqual({
      form: { bucket: 'my-bucket' },
    })
    expect(localStorage.getItem('companion-S3-s3-bucket')).toBe('my-bucket')
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
    const input = page.getByLabelText(
      'New name, or a path relative to the browsing root:',
    )
    await expect.element(input).toHaveValue('readme.md')
    await input.fill('notes.md')
    await page.getByRole('button', { name: 'Rename', exact: true }).click()
    await expect.element(page.getByText('notes.md')).toBeVisible()
    expect(companion.lastCall('/s3/mutate/move')?.body).toEqual({
      id: 'readme.md',
      destination: 'notes.md',
    })

    // Folders can be renamed too; the trailing slash is kept
    await page.getByRole('button', { name: 'Actions for docs' }).click()
    await page.getByRole('menuitem', { name: 'Rename / move…' }).click()
    await input.fill('archive')
    await userEvent.keyboard('{Enter}')
    await expect
      .element(page.getByText('archive', { exact: true }))
      .toBeVisible()
    expect(companion.lastCall('/s3/mutate/move')?.body).toEqual({
      id: 'docs/',
      destination: 'archive/',
    })

    // A path moves the file
    await page.getByRole('button', { name: 'Actions for notes.md' }).click()
    await page.getByRole('menuitem', { name: 'Rename / move…' }).click()
    await input.fill('archive/notes.md')
    await userEvent.keyboard('{Enter}')
    await expect
      .element(page.getByText('notes.md', { exact: true }))
      .not.toBeInTheDocument()
    expect(companion.lastCall('/s3/mutate/move')?.body).toEqual({
      id: 'notes.md',
      destination: 'archive/notes.md',
    })
  })

  it('deletes files after confirmation and refuses non-empty folders', async ({
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
    await expect
      .element(page.getByText('readme.md', { exact: true }))
      .not.toBeInTheDocument()
    expect(companion.lastCall('/s3/mutate/delete')?.body).toEqual({
      id: 'readme.md',
    })
    await expect
      .element(page.getByText(/Deleted "readme.md"/).first())
      .toBeVisible()

    // Companion refuses to delete folders that still have entries
    await page.getByRole('button', { name: 'Actions for docs' }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect
      .element(page.getByText('The folder is not empty').first())
      .toBeVisible()
    expect(companion.lastCall('/s3/mutate/delete')?.body).toEqual({
      id: 'docs/',
    })
    await expect.element(page.getByText('docs', { exact: true })).toBeVisible()
  })

  describe('server-issued grants', () => {
    it('shares renewal across concurrent expired requests and does not inherit a caller abort', async ({
      worker,
    }) => {
      const companion = createMockCompanion()
      install(worker, companion)
      const shortLived = mockGrant({
        bucket: 'my-bucket',
        exp: Math.floor(Date.now() / 1000) + 1,
      })
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
      const app = createUppy({ bucket: undefined, getGrant })
      await openBucket()
      await new Promise((resolve) => setTimeout(resolve, 1200))
      const plugin =
        app.getPlugin<S3<Record<string, unknown>, Record<string, never>>>('S3')
      if (!plugin) throw new Error('Missing S3 plugin')
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
      canceled.abort()
      await new Promise((resolve) => setTimeout(resolve, 50))
      if (!finishRenewal) throw new Error('Renewal did not start')
      finishRenewal(mockGrant({ bucket: 'my-bucket' }))
      await first
      expect(await secondResult).toHaveProperty('result')
      expect(getGrant).toHaveBeenCalledTimes(2)
    })
    it('connects with a grant instead of a bucket', async ({ worker }) => {
      const companion = createMockCompanion()
      install(worker, companion)
      const grant = mockGrant({ bucket: 'my-bucket' })
      const getGrant = vi.fn(async () => grant)
      createUppy({ bucket: undefined, getGrant })

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

    it('fetches a new grant when the session expires mid-way', async ({
      worker,
    }) => {
      let now = Math.floor(Date.now() / 1000)
      const companion = createMockS3Companion({
        token: TOKEN,
        nowSeconds: () => now,
      })
      install(worker, companion)
      const shortLived = mockGrant({
        bucket: 'my-bucket',
        exp: now + 900,
      })
      const getGrant = vi
        .fn<() => Promise<string>>()
        .mockResolvedValueOnce(shortLived)
        .mockImplementation(async () =>
          mockGrant({ bucket: 'my-bucket', exp: now + 900 }),
        )
      createUppy({ bucket: undefined, getGrant })

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
        bucket: undefined,
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
