import Uppy, { BasePlugin, type PluginOpts } from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import {
  createMockS3Companion,
  handleFetchRequest,
  mockGrant,
} from '@uppy/s3/mockCompanion'
import { http } from 'msw'
import { afterEach, beforeEach, describe, expect, vi } from 'vitest'
import { page } from 'vitest/browser'
import '@uppy/core/css/style.css'
import '@uppy/core/provider-views/css/style.css'
import '@uppy/dashboard/css/style.css'
import TransloaditStorage from '../lib/TransloaditStorage.js'
import { it } from './test-extend.js'

const COMPANION = 'http://localhost:3020'
const TOKEN = 'test-auth-token'
const createMockCompanion = () =>
  createMockS3Companion({ token: TOKEN, bucket: 'my-bucket' })
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
})
