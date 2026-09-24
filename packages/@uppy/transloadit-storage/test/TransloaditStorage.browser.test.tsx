import Uppy, { BasePlugin, type PluginOpts } from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import {
  createMockS3Companion,
  mockGrant,
  toMswHandlers,
} from '@uppy-dev/s3-mock-companion'
import { http } from 'msw'
import type { SetupWorker } from 'msw/browser'
import { afterEach, beforeEach, describe, expect, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import '@uppy/core/css/style.css'
import '@uppy/core/provider-views/css/style.css'
import '@uppy/dashboard/css/style.css'
import TransloaditStorage, {
  type TransloaditStorageOptions,
} from '../lib/TransloaditStorage.js'
import { it } from './test-extend.js'

const COMPANION = 'http://localhost:3020'
const TOKEN = 'test-auth-token'

/**
 * Serves a mock Companion and installs the plugin into an inline Dashboard.
 * The mock serves the `transloadit-storage` provider under its own path, with
 * native folder moves — the only thing that differs from generic S3.
 */
function setup(
  worker: SetupWorker,
  options: Partial<TransloaditStorageOptions> = {},
) {
  const companion = createMockS3Companion({ token: TOKEN })
  worker.use(...toMswHandlers(companion, COMPANION, { http }))
  const target = document.createElement('div')
  document.body.appendChild(target)
  uppy = new Uppy()
    .use(Dashboard, { target, inline: true })
    .use(TransloaditStorage, { companionUrl: COMPANION, ...options })
  return companion
}

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

beforeEach(() => {
  document.body.innerHTML = ''
  localStorage.clear()
})

afterEach(() => {
  uppy?.destroy()
  uppy = undefined
})

describe('Transloadit Storage in the browser', () => {
  it('offers the custom upload action without replacing an application Assembly', () => {
    const onUploadRequest = vi.fn()
    uppy = new Uppy().use(TransloaditStorage, {
      companionUrl: COMPANION,
      onUploadRequest,
    })
    const plugin =
      uppy.getPlugin<
        TransloaditStorage<Record<string, unknown>, Record<string, never>>
      >('TransloaditStorage')
    if (!plugin) throw new Error('Missing Transloadit Storage plugin')
    expect(plugin.builtInToolbarActions().map((action) => action.id)).toContain(
      'transloadit:uploadFiles',
    )
  })

  it('storeUploads refuses to overwrite explicit Assembly configuration', () => {
    const assemblyOptions = { params: { template_id: 'owned-template' } }
    uppy = new Uppy().use(FixtureUploader, { assemblyOptions })
    expect(() =>
      uppy?.use(TransloaditStorage, {
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

  it('Storage uses its own provider and keeps original downloads available to read-only users', async ({
    worker,
  }) => {
    const getDownloadUrl = vi.fn(async () => '/authorized-original/readme')
    const companion = setup(worker, {
      getGrant: async () =>
        mockGrant({ bucket: 'my-bucket', scopes: ['read'] }),
      getDownloadUrl,
    })
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await expect.element(page.getByText('readme.md')).toBeVisible()
    // Every request went to the plugin's own provider, never to /s3/.
    expect(
      companion.calls.every((call) =>
        call.path.startsWith('/transloadit-storage/'),
      ),
    ).toBe(true)
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

  it('takes files dropped on its panel when it stores uploads', async ({
    worker,
  }) => {
    worker.use(
      ...toMswHandlers(createMockS3Companion({ token: TOKEN }), COMPANION, {
        http,
      }),
    )
    const target = document.createElement('div')
    document.body.appendChild(target)
    uppy = new Uppy()
      .use(FixtureUploader, {})
      .use(Dashboard, { target, inline: true })
      .use(TransloaditStorage, {
        companionUrl: COMPANION,
        storeUploads: {
          signAssembly: async (params) => ({ params, signature: 'test' }),
        },
      })
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await expect.element(page.getByText('readme.md')).toBeVisible()

    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(new File(['hi'], 'dropped.txt'))
    const panel = document.querySelector('[data-uppy-panelType="PickerPanel"]')
    if (!panel) throw new Error('Missing picker panel')
    for (const type of ['dragover', 'drop']) {
      panel.dispatchEvent(
        new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }),
      )
    }
    await expect
      .poll(() => uppy?.getFiles().map((file) => file.name))
      .toEqual(['dropped.txt'])
  })

  it('renames a folder in one native move instead of walking it', async ({
    worker,
  }) => {
    const companion = setup(worker)
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await expect.element(page.getByText('readme.md')).toBeVisible()

    await page.getByRole('button', { name: 'Actions for docs' }).click()
    await page.getByRole('menuitem', { name: 'Rename / move…' }).click()
    await page
      .getByLabelText('New name, or a path relative to the browsing root:')
      .fill('archive')
    await userEvent.keyboard('{Enter}')

    await expect
      .element(page.getByText('archive', { exact: true }))
      .toBeVisible()
    // One call moved the whole subtree: no per-file moves, no folder bookkeeping.
    expect(
      companion.calls
        .filter((call) => call.path.endsWith('/mutate/move'))
        .map((call) => call.body),
    ).toEqual([{ id: 'docs/', destination: 'archive/' }])
    expect(
      companion.lastCall('/transloadit-storage/mutate/create-folder'),
    ).toBe(undefined)
    expect(companion.folders.get('archive/')).toEqual([
      { name: 'hello.txt', isFolder: false, size: 12, mimeType: 'text/plain' },
    ])
    expect(companion.folders.has('docs/')).toBe(false)
  })
})
