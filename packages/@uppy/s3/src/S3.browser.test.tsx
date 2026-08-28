import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import '@uppy/core/css/style.css'
import '@uppy/core/provider-views/css/style.css'
import '@uppy/dashboard/css/style.css'
import S3, { type S3Options } from './S3.js'
import { it } from './test-extend.js'

const COMPANION = 'http://localhost:3020'
const TOKEN = 'test-auth-token'

type Entry = {
  name: string
  isFolder: boolean
  size?: number
  mimeType?: string
}
type Call = { path: string; body: unknown; token: string | null }

function splitKey(key: string) {
  const bare = key.endsWith('/') ? key.slice(0, -1) : key
  const slash = bare.lastIndexOf('/')
  return {
    prefix: slash === -1 ? '' : bare.slice(0, slash + 1),
    name: bare.slice(slash + 1),
  }
}

/** A tiny in-memory bucket behind Companion's S3 provider endpoints. */
function createMockCompanion() {
  const folders = new Map<string, Entry[]>([
    [
      '',
      [
        { name: 'docs', isFolder: true },
        {
          name: 'readme.md',
          isFolder: false,
          size: 9,
          mimeType: 'text/markdown',
        },
      ],
    ],
    [
      'docs/',
      [
        {
          name: 'hello.txt',
          isFolder: false,
          size: 12,
          mimeType: 'text/plain',
        },
      ],
    ],
  ])
  const calls: Call[] = []

  const record = async (request: Request): Promise<Call> => {
    const call = {
      path: new URL(request.url).pathname,
      body: request.method === 'POST' ? await request.json() : undefined,
      token: request.headers.get('uppy-auth-token'),
    }
    calls.push(call)
    return call
  }
  const toItem = (prefix: string, entry: Entry) => {
    const key = `${prefix}${entry.name}${entry.isFolder ? '/' : ''}`
    return {
      isFolder: entry.isFolder,
      icon: entry.isFolder ? 'folder' : 'file',
      id: encodeURIComponent(key),
      name: entry.name,
      requestPath: encodeURIComponent(key),
      ...(entry.isFolder
        ? {}
        : {
            mimeType: entry.mimeType ?? null,
            size: entry.size ?? null,
            thumbnail: null,
          }),
    }
  }
  const unauthorized = () =>
    HttpResponse.json({ message: 'unauthorized' }, { status: 401 })

  const handlers = [
    http.options(
      `${COMPANION}/*`,
      () => new HttpResponse(null, { status: 204 }),
    ),
    http.post(`${COMPANION}/s3/simple-auth`, async ({ request }) => {
      await record(request)
      return HttpResponse.json({ uppyAuthToken: TOKEN })
    }),
    http.get(`${COMPANION}/s3/list/*`, async ({ request }) => {
      const { token } = await record(request)
      if (token !== TOKEN) return unauthorized()
      const prefix = decodeURIComponent(
        new URL(request.url).pathname.replace('/s3/list/', ''),
      )
      return HttpResponse.json({
        username: 'my-bucket',
        nextPagePath: null,
        items: (folders.get(prefix) ?? []).map((entry) =>
          toItem(prefix, entry),
        ),
      })
    }),
    http.post(`${COMPANION}/s3/mutate/create-folder`, async ({ request }) => {
      const { body, token } = await record(request)
      if (token !== TOKEN) return unauthorized()
      const { parentId, name } = body as {
        parentId: string | null
        name: string
      }
      const prefix = parentId ? decodeURIComponent(parentId) : ''
      folders.get(prefix)?.push({ name, isFolder: true })
      folders.set(`${prefix}${name}/`, [])
      const id = encodeURIComponent(`${prefix}${name}/`)
      return HttpResponse.json({ id, requestPath: id })
    }),
    http.post(`${COMPANION}/s3/mutate/delete`, async ({ request }) => {
      const { body, token } = await record(request)
      if (token !== TOKEN) return unauthorized()
      const { prefix, name } = splitKey(
        decodeURIComponent((body as { id: string }).id),
      )
      folders.set(
        prefix,
        (folders.get(prefix) ?? []).filter((entry) => entry.name !== name),
      )
      return HttpResponse.json({ ok: true })
    }),
    http.post(`${COMPANION}/s3/mutate/move`, async ({ request }) => {
      const { body, token } = await record(request)
      if (token !== TOKEN) return unauthorized()
      const { id, destination } = body as { id: string; destination: string }
      const from = splitKey(decodeURIComponent(id))
      const to = splitKey(destination)
      const entry = folders
        .get(from.prefix)
        ?.find((candidate) => candidate.name === from.name)
      folders.set(
        from.prefix,
        (folders.get(from.prefix) ?? []).filter(
          (candidate) => candidate.name !== from.name,
        ),
      )
      if (entry) folders.get(to.prefix)?.push({ ...entry, name: to.name })
      const newId = encodeURIComponent(destination)
      return HttpResponse.json({ id: newId, requestPath: newId })
    }),
    http.get(`${COMPANION}/s3/logout`, async ({ request }) => {
      await record(request)
      return HttpResponse.json({ ok: true, revoked: true })
    }),
  ]

  return {
    handlers,
    calls,
    lastCall: (path: string) =>
      calls.filter((call) => call.path === path).at(-1),
  }
}

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
    worker.use(...companion.handlers)
    createUppy()

    await openBucket()
    await expect.element(page.getByText('docs', { exact: true })).toBeVisible()
    expect(companion.lastCall('/s3/simple-auth')?.body).toEqual({
      form: { bucket: 'my-bucket' },
    })
    expect(localStorage.getItem('companion-S3-s3-bucket')).toBe('my-bucket')
  })

  it('reconnects when the stored session belongs to another bucket', async ({
    worker,
  }) => {
    localStorage.setItem('companion-S3-auth-token', 'stale-token')
    localStorage.setItem('companion-S3-s3-bucket', 'other-bucket')
    const companion = createMockCompanion()
    worker.use(...companion.handlers)
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

  it('opens one item menu at a time and closes it with Escape', async ({
    worker,
  }) => {
    const companion = createMockCompanion()
    worker.use(...companion.handlers)
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
    worker.use(...companion.handlers)
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

  it('renames in place, moves with a path, and deletes after confirmation', async ({
    worker,
  }) => {
    const companion = createMockCompanion()
    worker.use(...companion.handlers)
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
    await expect.element(page.getByText('notes.md')).not.toBeInTheDocument()
    expect(companion.lastCall('/s3/mutate/move')?.body).toEqual({
      id: 'notes.md',
      destination: 'archive/notes.md',
    })

    // Delete asks for confirmation first
    await page.getByRole('button', { name: 'Actions for archive' }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    const dialog = page.getByRole('dialog')
    await expect.element(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect.element(dialog).not.toBeInTheDocument()
    expect(companion.lastCall('/s3/mutate/delete')).toBeUndefined()

    await page.getByRole('button', { name: 'Actions for archive' }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect
      .element(page.getByText('archive', { exact: true }))
      .not.toBeInTheDocument()
    expect(companion.lastCall('/s3/mutate/delete')?.body).toEqual({
      id: 'archive/',
    })
    await expect
      .element(page.getByText(/Deleted "archive"/).first())
      .toBeVisible()
  })
})
