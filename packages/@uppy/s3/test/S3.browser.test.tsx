import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import { http } from 'msw'
import { afterEach, beforeEach, describe, expect, vi } from 'vitest'
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

const createMockCompanion = () =>
  createMockS3Companion({ token: TOKEN, bucket: 'my-bucket' })
const install = (
  worker: { use: (...handlers: any[]) => void },
  companion: ReturnType<typeof createMockCompanion>,
) => worker.use(...toMswHandlers(companion, COMPANION, { http }))

let uppy: Uppy | undefined

function createUppy(options: Partial<S3Options> = {}) {
  const target = document.createElement('div')
  document.body.appendChild(target)
  uppy = new Uppy().use(Dashboard, { target, inline: true }).use(S3, {
    companionUrl: COMPANION,
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
      'New name, or a full path to move it somewhere else:',
    )
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
    await page
      .getByLabelText('New name, or a full path to move it somewhere else:')
      .fill('archive')
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
    await page
      .getByLabelText('New name, or a full path to move it somewhere else:')
      .fill('docs/inner')
    await userEvent.keyboard('{Enter}')

    await expect
      .element(page.getByText('A folder cannot be moved into itself').first())
      .toBeVisible()
    expect(companion.lastCall('/s3/mutate/move')).toBeUndefined()
    expect(companion.lastCall('/s3/mutate/create-folder')).toBeUndefined()
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
    it('connects with a grant instead of a bucket', async ({ worker }) => {
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

    it('fetches a new grant when the session expires mid-way', async ({
      worker,
    }) => {
      const companion = createMockCompanion()
      install(worker, companion)
      const shortLived = mockGrant({
        bucket: 'my-bucket',
        exp: Math.floor(Date.now() / 1000) + 1,
      })
      const getGrant = vi
        .fn<() => Promise<string>>()
        .mockResolvedValueOnce(shortLived)
        .mockResolvedValue(mockGrant({ bucket: 'my-bucket' }))
      createUppy({ getGrant })

      await openBucket()
      await new Promise((resolve) => setTimeout(resolve, 1_200))
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
