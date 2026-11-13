import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import { HttpResponse, http } from 'msw'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest'
import { page, userEvent } from 'vitest/browser'
import '@uppy/core/css/style.css'
import '@uppy/core/provider-views/css/style.css'
import '@uppy/dashboard/css/style.css'
import '@uppy-dev/msw-setup'
import { network } from 'virtual:msw'
import {
  createMockS3Companion,
  type MockS3Companion,
  type MockS3CompanionOptions,
  mockGrant,
  toMswHandlers,
} from '@uppy-dev/s3-mock-companion'
import S3, { type S3Options } from '../lib/S3.js'

const COMPANION = 'http://localhost:3020'
const TOKEN = 'test-auth-token'
const RENAME_LABEL = 'New name, or a path relative to the root folder:'

let uppy: Uppy | undefined

type TestPlugin = S3<Record<string, unknown>, Record<string, never>>

const pluginOf = (app: Uppy): TestPlugin => {
  const plugin = app.getPlugin<TestPlugin>('S3')
  if (!plugin) throw new Error('Missing S3 plugin')
  return plugin
}

/** Serves a mock Companion through msw. */
function serveCompanion(options?: MockS3CompanionOptions) {
  const companion = createMockS3Companion({ token: TOKEN, ...options })
  network.use(...toMswHandlers(companion, COMPANION, { http }))
  return companion
}

/** Serves a mock Companion and installs the plugin into an inline Dashboard. */
function setup({
  companion: companionOptions,
  ...options
}: Partial<S3Options> & { companion?: MockS3CompanionOptions } = {}) {
  const companion = serveCompanion(companionOptions)
  const target = document.createElement('div')
  document.body.appendChild(target)
  uppy = new Uppy().use(Dashboard, { target, inline: true }).use(S3, {
    companionUrl: COMPANION,
    ...options,
  })
  return { companion, plugin: pluginOf(uppy) }
}

async function openBucket() {
  await page.getByRole('tab', { name: 'S3' }).click()
  await expect.element(page.getByText('readme.md')).toBeVisible()
}

/**
 * Installs the plugin without a Dashboard, in manager mode unless told
 * otherwise (as a file library using `useS3Manager` does), and lists the root.
 */
async function setupHeadless({
  companion: companionOptions,
  ...options
}: Partial<S3Options> & { companion?: MockS3CompanionOptions } = {}) {
  const companion = serveCompanion(companionOptions)
  uppy = new Uppy().use(S3, {
    companionUrl: COMPANION,
    mode: 'manager',
    ...options,
  })
  const plugin = pluginOf(uppy)
  const info = vi.spyOn(uppy, 'info')
  await plugin.openFolderPath(null)
  /** The toasts shown so far, one per line. */
  const toasts = () =>
    info.mock.calls
      .map(([message]) =>
        typeof message === 'string' ? message : message.message,
      )
      .join('\n')
  return { companion, plugin, toasts }
}

/** The names of the open folder's items. */
const names = (plugin: TestPlugin) =>
  plugin.view.getDisplayedPartialTree().map((item) => item.data.name)

function itemOf(plugin: TestPlugin, id: string) {
  const item = plugin
    .getPluginState()
    .partialTree.find((node) => node.id === id)
  if (!item || item.type === 'root') throw new Error(`Missing ${id}`)
  return item
}

type ActionList = 'actions' | 'toolbarActions' | 'bulkActions'

/** The plugin's action with this id, from `opts.actions` unless told otherwise. */
function actionOf<L extends ActionList = 'actions'>(
  plugin: TestPlugin,
  id: string,
  list: L = 'actions' as L,
) {
  const actions = plugin.view.opts[list] as { id: string }[] | undefined
  const action = actions?.find((a) => a.id === id)
  if (!action) throw new Error(`Missing ${list} ${id}`)
  return action as NonNullable<TestPlugin['view']['opts'][L]>[number]
}

/** The prompt or confirm an action opened, once it is open. */
async function dialogOf(plugin: TestPlugin) {
  await vi.waitFor(() => expect(plugin.getPluginState().dialog).toBeDefined())
  return plugin.getPluginState().dialog
}

/** The first listing came after the login, without an unauthenticated probe. */
function expectLoginBeforeListing(companion: MockS3Companion) {
  const paths = companion.calls.map((call) => call.path)
  const firstAuth = paths.findIndex((p) => p.endsWith('/s3/simple-auth'))
  const firstList = paths.findIndex((p) => p.includes('/s3/list'))
  expect(firstAuth).toBeGreaterThanOrEqual(0)
  expect(firstList).toBeGreaterThan(firstAuth)
  expect(companion.calls.filter((call) => call.status === 401)).toEqual([])
}

/**
 * A `getGrant` whose first grant expires in 15 minutes (of the mock's clock)
 * and whose renewal waits until the test calls `finishRenewal()`.
 */
function grantWithPendingRenewal(now: () => number) {
  let finish: ((grant: string) => void) | undefined
  const getGrant = vi
    .fn<() => Promise<string>>()
    .mockResolvedValueOnce(mockGrant({ bucket: 'my-bucket', exp: now() + 900 }))
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
  const finishRenewal = () => {
    if (!finish) throw new Error('Renewal did not start')
    finish(mockGrant({ bucket: 'my-bucket', exp: now() + 900 }))
  }
  return { getGrant, finishRenewal }
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
  it('auto-connects and lists the bucket Companion serves', async () => {
    const { companion } = setup()

    await openBucket()
    await expect.element(page.getByText('docs', { exact: true })).toBeVisible()
    // The client cannot pick a bucket: it just asks for a session.
    expect(companion.lastCall('/s3/simple-auth')?.body).toEqual({ form: {} })
    expectLoginBeforeListing(companion)
  })

  it('reuses a stored session instead of connecting again', async () => {
    localStorage.setItem('companion-S3-auth-token', TOKEN)
    const { companion } = setup()

    await openBucket()
    expect(companion.lastCall('/s3/simple-auth')).toBeUndefined()
    expect(companion.calls.every((call) => call.token === TOKEN)).toBe(true)
  })

  it('pins a queued import URL to the bucket where the file was selected', async () => {
    const { plugin } = setup()
    await openBucket()
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

  it('opens a folder beyond the first listing page', async () => {
    const { plugin } = setup({
      companion: {
        pageSize: 1,
        folders: {
          '': [
            { name: 'readme.md', isFolder: false },
            { name: 'docs', isFolder: true },
          ],
          'docs/': [],
        },
      },
    })
    expect(await plugin.openFolderPath('docs/')).toBe(true)
    expect(plugin.getPluginState().currentFolderId).toBe('docs%2F')
  })

  it('normalizes grant roots before deriving customer paths', async () => {
    const { plugin } = setup({
      getGrant: async () =>
        mockGrant({ bucket: 'my-bucket', prefix: '/tenant' }),
    })
    await plugin.openFolderPath('')
    expect(plugin.rootPrefix).toBe('tenant/')
  })

  it('forgets the session on logout', async () => {
    const { plugin } = setup({
      getGrant: async () =>
        mockGrant({ bucket: 'my-bucket', prefix: 'tenant/' }),
    })
    await plugin.openFolderPath('')
    expect(plugin.rootPrefix).toBe('tenant/')
    expect(plugin.canWrite).toBe(true)
    await plugin.view.logout()
    expect(plugin.rootPrefix).toBe('')
    expect(plugin.canWrite).toBe(false)
  })

  it('keeps a cancelled rename from discarding its listing', async () => {
    const { plugin } = await setupHeadless()
    vi.spyOn(plugin.view, 'prompt').mockResolvedValue(null)
    const refresh = vi.spyOn(plugin.view, 'refreshCurrentFolder')
    await plugin.view.runAction(
      actionOf(plugin, 's3:rename'),
      itemOf(plugin, 'readme.md'),
    )
    expect(refresh).not.toHaveBeenCalled()
  })

  it('hides write actions when Companion reports a read-only session', async () => {
    const { plugin } = await setupHeadless({ companion: { canWrite: false } })
    expect(plugin.canWrite).toBe(false)
    expect(plugin.builtInActions()).toEqual([])
    expect(plugin.builtInToolbarActions()).toEqual([])
    expect(plugin.builtInBulkActions()).toEqual([])
  })

  it('offers no built-in file changes with enableActions: false', async () => {
    const { plugin } = await setupHeadless({ enableActions: false })
    expect(plugin.canWrite).toBe(true)
    expect(plugin.builtInActions()).toEqual([])
    expect(plugin.builtInToolbarActions()).toEqual([])
    expect(plugin.builtInBulkActions()).toEqual([])
  })

  it('has no Dashboard tab in manager mode: it is headless', async () => {
    const { companion } = setup({ mode: 'manager' })
    await expect
      .poll(() => document.querySelector('.uppy-Dashboard'))
      .toBeTruthy()
    // S3 is the only acquirer: without it the Dashboard has no tabs at all.
    expect(document.querySelectorAll('[role="tab"]')).toHaveLength(0)
    expect(companion.calls).toEqual([])
  })

  it("keeps a headless manager's folder and operation when a Dashboard panel closes", async () => {
    const { plugin } = setup({ mode: 'manager' })
    expect(await plugin.openFolderPath('docs/')).toBe(true)
    const operation = plugin.view
      .runWithProgress(
        ({ signal }) =>
          new Promise((_, reject) =>
            signal.addEventListener('abort', () => reject(signal.reason)),
          ),
      )
      .catch((err: unknown) => err)

    uppy!.emit('dashboard:close-panel', 'Webcam')
    expect(plugin.view.canCancelOperation).toBe(true)
    expect(plugin.getPluginState().currentFolderId).toBe('docs%2F')

    plugin.view.cancelLongOperation()
    expect(await operation).toMatchObject({ name: 'AbortError' })
  })

  it('replaces an open prompt without keeping its previous input', async () => {
    const { view } = setup().plugin
    await openBucket()
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

  it.for<[string, (plugin: TestPlugin) => Promise<unknown>]>([
    ['deleting', (plugin) => plugin.provider.deleteItem('docs')],
    ['moving', (plugin) => plugin.provider.moveItem('docs', 'x')],
  ])('the mock preserves a same-named folder when %s a file', async ([
    ,
    mutate,
  ]) => {
    const { companion, plugin } = setup({
      companion: {
        folders: {
          '': [
            { name: 'readme.md', isFolder: false },
            { name: 'docs', isFolder: false },
            { name: 'docs', isFolder: true },
          ],
          'docs/': [],
        },
      },
    })
    await openBucket()
    await mutate(plugin)
    expect(companion.folders.get('')).toContainEqual({
      name: 'docs',
      isFolder: true,
    })
    expect(companion.folders.get('')).not.toContainEqual({
      name: 'docs',
      isFolder: false,
    })
  })

  it('restores a session scoped to a prefix and opens its nested folder', async () => {
    const { plugin } = setup({
      autoConnect: false,
      companion: {
        // Companion confines this session to a prefix and reports it in the
        // listing; the client never asks for one.
        prefix: 'tenant/',
        folders: {
          'tenant/': [{ name: 'photos', isFolder: true }],
          'tenant/photos/': [],
        },
      },
    })
    await plugin.view.handleAuth({})
    expect(plugin.rootPrefix).toBe('tenant/')
    expect(await plugin.openFolderPath('tenant/photos/')).toBe(true)
    expect(plugin.getPluginState().currentFolderId).toBe('tenant%2Fphotos%2F')
    expect(await plugin.openFolderPath('outside/')).toBe(false)
  })

  it('opens a headless folder without waiting for a panel to start the listing', async () => {
    serveCompanion()
    uppy = new Uppy().use(S3, { companionUrl: COMPANION })
    const plugin = pluginOf(uppy)
    const started = performance.now()
    expect(await plugin.openFolderPath('docs/')).toBe(true)
    expect(performance.now() - started).toBeLessThan(2000)
    expect(plugin.getPluginState().currentFolderId).toBe('docs%2F')
  }, 20000)

  it('bulk actions receive only topmost selected entries and refresh after partial failure', async () => {
    const { companion, plugin } = await setupHeadless()
    await plugin.view.openFolder('docs%2F')
    await plugin.view.openFolder(null)
    plugin.view.toggleCheckbox(itemOf(plugin, 'docs%2F'), false)
    const selections: string[][] = []
    await plugin.view.runBulkAction({
      id: 'test:partial',
      label: 'Move',
      run({ items }) {
        selections.push(items.map((item) => item.id))
        companion.folders
          .get('docs/')
          ?.push({ name: 'added.txt', isFolder: false })
        throw new Error('Expected partial mutation failure')
      },
    })
    expect(selections).toEqual([['docs%2F']])
    await plugin.view.openFolder('docs%2F')
    expect(names(plugin)).toContain('added.txt')
  })

  it('selecting the only child never makes its propagated parent a mutation target', async () => {
    const { companion, plugin } = await setupHeadless()
    await plugin.view.openFolder('docs%2F')
    plugin.view.toggleCheckbox(itemOf(plugin, 'docs%2Fhello.txt'), false)
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

  it('resolves typed move destinations relative to the granted root', async () => {
    const { companion, plugin, toasts } = await setupHeadless({
      getGrant: async () =>
        mockGrant({ bucket: 'my-bucket', prefix: 'tenant/' }),
      companion: {
        folders: {
          'tenant/': [
            { name: 'photo.jpg', isFolder: false },
            { name: 'archive', isFolder: true },
          ],
          'tenant/archive/': [],
        },
      },
    })
    const moving = plugin.view.runAction(
      actionOf(plugin, 's3:rename'),
      itemOf(plugin, 'tenant%2Fphoto.jpg'),
    )
    await dialogOf(plugin)
    plugin.view.submitDialog('archive/photo.jpg')
    await moving
    expect(companion.lastCall('/s3/mutate/move')?.body).toEqual({
      id: 'tenant/photo.jpg',
      destination: 'tenant/archive/photo.jpg',
    })
    // The toast shows the path as typed, not the key with the root prefix.
    expect(toasts()).toContain('Moved to "archive/photo.jpg"')
    expect(names(plugin)).not.toContain('photo.jpg')
  })

  it('dismisses a dialog on a backdrop click, not on a click that only ends there', async () => {
    const { view } = setup().plugin
    await openBucket()

    /** A click on the `::backdrop` (outside the box), and one that only ends there. */
    const click = (dialog: Element, { startInside = false } = {}) => {
      const rect = dialog.getBoundingClientRect()
      const outside = {
        bubbles: true,
        clientX: rect.left - 5,
        clientY: rect.top - 5,
      }
      dialog.dispatchEvent(
        new PointerEvent(
          'pointerdown',
          startInside
            ? { bubbles: true, clientX: rect.left + 5, clientY: rect.top + 5 }
            : outside,
        ),
      )
      dialog.dispatchEvent(new MouseEvent('click', outside))
    }

    const answered = view.prompt({ title: 'New folder' })
    const prompt = page.getByRole('dialog', { name: 'New folder' })
    await expect.element(prompt).toBeVisible()
    // Selecting text inside and releasing outside is not a dismissal.
    click(prompt.element(), { startInside: true })
    await expect.element(prompt).toBeVisible()
    click(prompt.element())
    await expect.element(prompt).not.toBeInTheDocument()
    await expect(answered).resolves.toBeNull()
  })

  it('starts a destructive confirm on Cancel', async () => {
    const { view } = setup().plugin
    await openBucket()
    const confirmed = view.confirm({ title: 'Delete it?', danger: true })
    await expect
      .element(
        page
          .getByRole('dialog', { name: 'Delete it?' })
          .getByRole('button', { name: 'Cancel' }),
      )
      .toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await expect(confirmed).resolves.toBe(false)
  })

  it('says a failed action failed, and blames Companion only for its requests', async () => {
    const { plugin, toasts } = await setupHeadless({
      actions: [
        {
          id: 'broken',
          label: 'Broken',
          refresh: false,
          run: () => {
            throw new Error('internal detail')
          },
        },
      ],
    })
    const readme = itemOf(plugin, 'readme.md')

    await plugin.view.runAction(actionOf(plugin, 'broken'), readme)
    expect(toasts()).toContain('The action failed')
    expect(toasts()).not.toContain('internal detail')

    network.use(
      http.post(`${COMPANION}/s3/mutate/delete`, () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    )
    const deleting = plugin.view.runAction(
      actionOf(plugin, 's3:delete'),
      readme,
    )
    await dialogOf(plugin)
    plugin.view.submitDialog()
    await deleting
    expect(toasts()).toContain('Connection with Companion failed')
  })

  it('keeps the detail item through overlapping refreshes', async () => {
    const { plugin } = await setupHeadless()
    plugin.view.openItemDetail(itemOf(plugin, 'readme.md'))

    // The second refresh aborts the first one's listing.
    await Promise.all([
      plugin.view.refreshCurrentFolder(true),
      plugin.view.refreshCurrentFolder(true),
    ])
    expect(plugin.view.getDetailItem()?.id).toBe('readme.md')
  })

  it('adds files dropped on its panel to the uploads, like a drop on the Dashboard', async () => {
    setup()
    await openBucket()
    const panel = document.querySelector('[data-uppy-panelType="PickerPanel"]')
    if (!panel) throw new Error('Missing picker panel')
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(new File(['hi'], 'dropped.txt'))
    for (const type of ['dragover', 'drop']) {
      panel.dispatchEvent(
        new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }),
      )
    }
    await expect
      .poll(() => uppy?.getFiles().map((file) => file.name))
      .toEqual(['dropped.txt'])
  })

  it('counts the selection as the bulk actions get it and warns about folder contents', async () => {
    const { plugin } = await setupHeadless()
    // With docs listed, its file is checked along with it: still one item.
    await plugin.view.openFolder('docs%2F')
    await plugin.view.openFolder(null)
    plugin.view.toggleCheckbox(itemOf(plugin, 'docs%2F'), false)
    plugin.view.toggleCheckbox(itemOf(plugin, 'readme.md'), false)
    expect(
      plugin.view
        .getBulkActionItems()
        .map((item) => item.id)
        .sort(),
    ).toEqual(['docs%2F', 'readme.md'])

    const deleting = plugin.view.runBulkAction(
      actionOf(plugin, 's3:bulkDelete', 'bulkActions'),
    )
    expect(await dialogOf(plugin)).toMatchObject({
      kind: 'confirm',
      title: 'Delete 2 items?',
      message: 'The selected folder and everything in it will be deleted.',
      danger: true,
    })
    plugin.view.cancelDialog()
    await deleting

    const moving = plugin.view.runBulkAction(
      actionOf(plugin, 's3:bulkMove', 'bulkActions'),
    )
    expect(await dialogOf(plugin)).toMatchObject({
      kind: 'prompt',
      title: 'Move 2 items',
    })
    plugin.view.cancelDialog()
    await moving
  })

  it("reports a long operation's progress and stops it on request", async () => {
    const { plugin } = await setupHeadless()
    const operation = plugin.view
      .runWithProgress(({ signal, setProgress }) => {
        setProgress('Moving 1 of 2 files…')
        return new Promise((_, reject) =>
          signal.addEventListener('abort', () => reject(signal.reason)),
        )
      })
      .catch((err: unknown) => err)
    expect(plugin.getPluginState().loading).toBe('Moving 1 of 2 files…')
    expect(plugin.view.canCancelOperation).toBe(true)

    plugin.view.cancelLongOperation()
    expect(await operation).toMatchObject({ name: 'AbortError' })
    expect(plugin.view.canCancelOperation).toBe(false)
    expect(plugin.getPluginState().loading).toBe(false)
  })

  it('applies mode and enableActions changed with setOptions right away', async () => {
    const { plugin } = await setupHeadless({ mode: 'picker' })
    const toolbar = () => plugin.view.opts.toolbarActions?.map((a) => a.id)
    expect(toolbar()).toEqual([])

    plugin.setOptions({ mode: 'manager' })
    expect(plugin.view.opts.mode).toBe('manager')
    expect(toolbar()).toEqual(['s3:newFolder'])

    plugin.setOptions({ enableActions: false })
    expect(toolbar()).toEqual([])

    plugin.setOptions({ mode: 'picker', enableActions: true })
    expect(plugin.view.opts.mode).toBe('picker')
    expect(toolbar()).toEqual([])
  })

  it('keeps the selection when setOptions repeats the default mode', async () => {
    const { plugin } = setup()
    await openBucket()
    await page.getByRole('checkbox', { name: 'readme.md' }).click()
    expect(plugin.view.getSelectedAmount()).toBe(1)

    plugin.setOptions({ mode: 'picker' })
    expect(plugin.view.getSelectedAmount()).toBe(1)
  })

  it('opens one item menu at a time and closes it with Escape', async () => {
    // Picker mode shows the menu too, for the plugin's own actions.
    setup({
      actions: [
        { id: 'test:noop', label: 'Do nothing', refresh: false, run() {} },
      ],
    })
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

  /**
   * Opens a "New folder" prompt in a picker inside a Dashboard *modal* (the
   * inline harness never hits the Dashboard's document-level Escape handler);
   * resolves to a spy on the modal closing.
   */
  async function openPromptInDashboardModal() {
    serveCompanion()
    uppy = new Uppy()
      .use(Dashboard, { inline: false })
      .use(S3, { companionUrl: COMPANION })
    // The close is animated, so watch for the request rather than the state.
    const modalClosed = vi.fn()
    uppy.on('dashboard:modal-closed', modalClosed)
    uppy
      .getPlugin<Dashboard<Record<string, unknown>, Record<string, never>>>(
        'Dashboard',
      )
      ?.openModal()
    await openBucket()
    void pluginOf(uppy).view.prompt({ title: 'New folder' })
    await expect
      .element(page.getByRole('dialog', { name: 'New folder' }))
      .toBeVisible()
    return modalClosed
  }

  it('closes a prompt with Escape without closing the Dashboard modal', async () => {
    const modalClosed = await openPromptInDashboardModal()

    await userEvent.keyboard('{Escape}')
    await expect
      .element(page.getByRole('dialog', { name: 'New folder' }))
      .not.toBeInTheDocument()
    // The same key press must not fall through to the Dashboard's own Escape handler.
    expect(modalClosed).not.toHaveBeenCalled()
  })

  it('closes a prompt with Escape on engines without showModal()', async () => {
    // Safari < 15.4 has no showModal(); the dialog then opens non-modal and
    // never fires `cancel` on Escape.
    const showModal = Object.getOwnPropertyDescriptor(
      HTMLDialogElement.prototype,
      'showModal',
    )
    if (!showModal) throw new Error('Expected a native showModal()')
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      value: undefined,
      configurable: true,
    })
    try {
      const modalClosed = await openPromptInDashboardModal()

      await userEvent.keyboard('{Escape}')
      await expect
        .element(page.getByRole('dialog', { name: 'New folder' }))
        .not.toBeInTheDocument()
      expect(modalClosed).not.toHaveBeenCalled()
    } finally {
      Object.defineProperty(HTMLDialogElement.prototype, 'showModal', showModal)
    }
  })

  it('creates a folder and refreshes the listing', async () => {
    const { companion, plugin, toasts } = await setupHeadless()
    const creating = plugin.view.runToolbarAction(
      actionOf(plugin, 's3:newFolder', 'toolbarActions'),
    )
    expect(await dialogOf(plugin)).toMatchObject({
      kind: 'prompt',
      label: 'Name of the new folder:',
    })
    plugin.view.submitDialog('reports')
    await creating

    expect(names(plugin)).toContain('reports')
    expect(plugin.getPluginState().dialog).toBeUndefined()
    expect(companion.lastCall('/s3/mutate/create-folder')?.body).toEqual({
      parentId: null,
      name: 'reports',
    })
    expect(toasts()).toContain('Created folder "reports"')
  })

  it('renames in place and moves with a path', async () => {
    const { companion, plugin } = await setupHeadless()
    const rename = actionOf(plugin, 's3:rename')

    // Bare name → rename in the current folder
    let renaming = plugin.view.runAction(rename, itemOf(plugin, 'readme.md'))
    expect(await dialogOf(plugin)).toMatchObject({
      label: RENAME_LABEL,
      defaultValue: 'readme.md',
    })
    plugin.view.submitDialog('notes.md')
    await renaming
    expect(names(plugin)).toContain('notes.md')
    expect(companion.lastCall('/s3/mutate/move')?.body).toEqual({
      id: 'readme.md',
      destination: 'notes.md',
    })

    // A path moves the file
    renaming = plugin.view.runAction(rename, itemOf(plugin, 'notes.md'))
    await dialogOf(plugin)
    plugin.view.submitDialog('docs/notes.md')
    await renaming
    expect(companion.lastCall('/s3/mutate/move')?.body).toEqual({
      id: 'notes.md',
      destination: 'docs/notes.md',
    })
    expect(names(plugin)).not.toContain('notes.md')
  })

  it('renames a folder by moving its contents one by one', async () => {
    const { companion, plugin, toasts } = await setupHeadless()
    const renaming = plugin.view.runAction(
      actionOf(plugin, 's3:rename'),
      itemOf(plugin, 'docs%2F'),
    )
    await dialogOf(plugin)
    plugin.view.submitDialog('archive')
    await renaming

    expect(names(plugin)).toContain('archive')
    expect(names(plugin)).not.toContain('docs')
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
    expect(toasts()).toContain('Renamed to "archive"')
  })

  it('refuses to move a folder into itself', async () => {
    const { companion, plugin, toasts } = await setupHeadless()
    const moving = plugin.view.runAction(
      actionOf(plugin, 's3:rename'),
      itemOf(plugin, 'docs%2F'),
    )
    await dialogOf(plugin)
    plugin.view.submitDialog('docs/inner')
    await moving

    expect(toasts()).toContain('A folder cannot be moved into itself')
    expect(companion.lastCall('/s3/mutate/move')).toBeUndefined()
    expect(companion.lastCall('/s3/mutate/create-folder')).toBeUndefined()
  })

  it('deletes files after confirmation and folders with their contents', async () => {
    const { companion, plugin, toasts } = await setupHeadless()
    const remove = actionOf(plugin, 's3:delete')

    // Cancel leaves everything alone
    let deleting = plugin.view.runAction(remove, itemOf(plugin, 'readme.md'))
    await dialogOf(plugin)
    plugin.view.cancelDialog()
    await deleting
    expect(companion.lastCall('/s3/mutate/delete')).toBeUndefined()

    // Confirm deletes the file and says so.
    deleting = plugin.view.runAction(remove, itemOf(plugin, 'readme.md'))
    await dialogOf(plugin)
    plugin.view.submitDialog()
    await deleting
    expect(toasts()).toContain('Deleted "readme.md"')
    expect(companion.lastCall('/s3/mutate/delete')?.body).toEqual({
      id: 'readme.md',
    })
    expect(names(plugin)).not.toContain('readme.md')

    // A folder is emptied first (Companion only deletes empty folders), then
    // deleted itself.
    deleting = plugin.view.runAction(remove, itemOf(plugin, 'docs%2F'))
    expect(await dialogOf(plugin)).toMatchObject({
      message: 'The folder and everything in it will be deleted.',
    })
    plugin.view.submitDialog()
    await deleting
    expect(toasts()).toContain('Deleted "docs"')
    expect(names(plugin)).not.toContain('docs')
    expect(
      companion.calls
        .filter((call) => call.path === '/s3/mutate/delete')
        .slice(1)
        .map((call) => call.body),
    ).toEqual([{ id: 'docs/hello.txt' }, { id: 'docs/' }])
    expect(companion.folders.has('docs/')).toBe(false)
  })

  it('offers no file changes in picker mode: picking is not changing', async () => {
    setup()
    await openBucket()

    await page.getByRole('checkbox', { name: /docs/ }).click()
    await page.getByRole('checkbox', { name: 'readme.md' }).click()
    for (const name of ['New folder…', 'Move…', 'Delete']) {
      await expect
        .element(page.getByRole('button', { name, exact: true }))
        .not.toBeInTheDocument()
    }
    await expect
      .element(page.getByRole('button', { name: 'Actions for readme.md' }))
      .not.toBeInTheDocument()
  })

  describe('server-issued grants', () => {
    it('connects with a grant instead of a plain session', async () => {
      const grant = mockGrant({ bucket: 'my-bucket' })
      const getGrant = vi.fn(async () => grant)
      const { companion, plugin } = await setupHeadless({ getGrant })
      expect(getGrant).toHaveBeenCalledTimes(1)
      expect(companion.lastCall('/s3/simple-auth')?.body).toEqual({
        form: { grant },
      })
      expectLoginBeforeListing(companion)
      expect(companion.session).toMatchObject({ bucket: 'my-bucket' })
      // Mutations are available: the grant carries the write scope.
      expect(plugin.builtInToolbarActions().map((action) => action.id)).toEqual(
        ['s3:newFolder'],
      )
    })

    it('does not restore a session when a pending grant resolves after logout', async () => {
      let now = Math.floor(Date.now() / 1000)
      const { getGrant, finishRenewal } = grantWithPendingRenewal(() => now)
      const { companion, plugin } = setup({
        getGrant,
        companion: { nowSeconds: () => now },
      })
      await openBucket()
      now += 901
      const request = plugin.provider.list(null, {
        signal: new AbortController().signal,
      })
      await vi.waitFor(() => expect(getGrant).toHaveBeenCalledTimes(2))
      await plugin.view.logout()
      finishRenewal()
      await expect(request).rejects.toThrow()
      expect(await plugin.storage.getItem(plugin.provider.tokenKey)).toBeNull()
      expect(plugin.getPluginState().authenticated).toBe(false)
      expect(
        companion.calls.filter((call) => call.path.endsWith('/simple-auth')),
      ).toHaveLength(1)
    })

    it('shares renewal across concurrent expired requests and does not inherit a caller abort', async () => {
      let now = Math.floor(Date.now() / 1000)
      const { getGrant, finishRenewal } = grantWithPendingRenewal(() => now)
      const { companion, plugin } = setup({
        getGrant,
        companion: { nowSeconds: () => now },
      })
      await openBucket()
      now += 901
      const canceled = new AbortController()
      const first = plugin.provider
        .list(null, { signal: canceled.signal })
        .catch((error: unknown) => error)
      await vi.waitFor(() => expect(getGrant).toHaveBeenCalledTimes(2))
      const second = plugin.provider.list(null, {
        signal: new AbortController().signal,
      })
      await vi.waitFor(() =>
        expect(
          companion.calls.filter((call) => call.status === 401),
        ).toHaveLength(2),
      )
      canceled.abort()
      finishRenewal()
      await first
      await second
      expect(getGrant).toHaveBeenCalledTimes(2)
    })

    it('fetches a new grant when the session expires mid-way', async () => {
      let now = Math.floor(Date.now() / 1000)
      const getGrant = vi.fn(async () =>
        mockGrant({ bucket: 'my-bucket', exp: now + 900 }),
      )
      const { companion } = setup({
        getGrant,
        companion: { nowSeconds: () => now },
      })

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

    it('hides the mutation actions for a read-only grant', async () => {
      const { companion, plugin } = await setupHeadless({
        getGrant: async () =>
          mockGrant({ bucket: 'my-bucket', scopes: ['read'] }),
      })
      expect(companion.session?.scopes).toEqual(['read'])
      expect(plugin.canWrite).toBe(false)
      expect(plugin.builtInActions()).toEqual([])
      expect(plugin.builtInToolbarActions()).toEqual([])
      expect(plugin.builtInBulkActions()).toEqual([])
    })
  })
})
