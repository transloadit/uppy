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
} from './mockCompanion.js'
import S3, { type S3Options } from './S3.js'
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
    bucket: 'my-bucket',
    ...options,
  })
  return uppy
}

async function openBucket() {
  await page.getByRole('tab', { name: 'S3' }).click()
  await expect.element(page.getByText('readme.md')).toBeVisible()
}

/** A clean auto-connect logs in first: no listing (and no 401) before simple-auth. */
function expectAuthenticatedBeforeListing(
  companion: ReturnType<typeof createMockCompanion>,
) {
  const paths = companion.calls.map((call) => call.path)
  const firstAuth = paths.findIndex((p) => p.endsWith('/s3/simple-auth'))
  const firstList = paths.findIndex((p) => p.includes('/s3/list'))
  expect(firstAuth).toBeGreaterThanOrEqual(0)
  expect(firstList).toBeGreaterThan(firstAuth)
  expect(companion.calls.filter((call) => call.status === 401)).toEqual([])
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
    expectAuthenticatedBeforeListing(companion)
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
      expectAuthenticatedBeforeListing(companion)
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
      createUppy({ bucket: undefined, getGrant })

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
