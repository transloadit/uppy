import '@uppy/core/css/style.css'
import '@uppy/core/provider-views/css/style.css'
import '@uppy/dashboard/css/style.css'
import '@uppy-dev/msw-setup'

import type { Meta, PluginOpts } from '@uppy/core'

import type { StoreAssemblyParameters } from '../lib/storeAssemblyOptions.js'
import type { TransloaditStorageOptions } from '../lib/TransloaditStorage.js'

import { network } from 'virtual:msw'
import Uppy, { BasePlugin } from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import {
  createMockS3Companion,
  mockGrant,
  toMswHandlers,
} from '@uppy-dev/s3-mock-companion'
import { http } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'

import { createStoreAssemblyOptions } from '../lib/storeAssemblyOptions.js'
import TransloaditStorage from '../lib/TransloaditStorage.js'

const COMPANION = 'http://localhost:3020'
const TOKEN = 'test-auth-token'
// biome-ignore lint/suspicious/noTemplateCurlyInString: a Transloadit placeholder.
const FILE_NAME = '${file.name}'

function dropFile(name: string): void {
  const panel = document.querySelector('[data-uppy-panelType="PickerPanel"]')
  if (!panel) throw new Error('Missing picker panel')
  const dataTransfer = new DataTransfer()
  dataTransfer.items.add(new File(['hi'], name))
  for (const type of ['dragover', 'drop']) {
    panel.dispatchEvent(
      new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }),
    )
  }
}

/**
 * Serves a mock Companion and installs the plugin into an inline Dashboard.
 * The mock serves the `transloadit-storage` provider under its own path, with
 * native folder moves — the only thing that differs from generic S3.
 */
function setup(options: Partial<TransloaditStorageOptions> = {}) {
  const companion = createMockS3Companion({ token: TOKEN })
  network.use(...toMswHandlers(companion, COMPANION, { http }))
  const target = document.createElement('div')
  document.body.appendChild(target)
  uppy = new Uppy()
  if (options.storeUploads) uppy.use(FixtureUploader, {})
  uppy
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
  it('offers the custom upload action in picker mode, and hands it the open folder', async () => {
    const onUploadRequest = vi.fn()
    setup({ onUploadRequest })
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await expect.element(page.getByText('readme.md')).toBeVisible()

    await page.getByRole('button', { name: 'Upload files' }).click()
    expect(onUploadRequest).toHaveBeenCalledWith({ prefix: '' })
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

  it('Storage uses its own provider and keeps original downloads available to read-only users', async () => {
    const getDownloadUrl = vi.fn(async () => '/authorized-original/readme')
    const companion = setup({
      getGrant: async () =>
        mockGrant({ bucket: 'my-bucket', scopes: ['read'] }),
      getDownloadUrl,
      onUploadRequest: () => {},
    })
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await expect.element(page.getByText('readme.md')).toBeVisible()
    // Every request went to the plugin's own provider, never to /s3/.
    expect(
      companion.calls.every((call) =>
        call.path.startsWith('/transloadit-storage/'),
      ),
    ).toBe(true)
    // Uploads land in the open folder, which a read-only grant may not change.
    await expect
      .element(page.getByRole('button', { name: 'Upload files' }))
      .not.toBeInTheDocument()
    await page.getByRole('button', { name: 'Actions for readme.md' }).click()
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

  it('takes files dropped on its panel when it stores uploads', async () => {
    network.use(
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

    const panel = document.querySelector('[data-uppy-panelType="PickerPanel"]')
    if (!panel) throw new Error('Missing picker panel')
    const drag = (types: string[], dataTransfer: DataTransfer) => {
      for (const type of types) {
        panel.dispatchEvent(
          new DragEvent(type, {
            bubbles: true,
            cancelable: true,
            dataTransfer,
          }),
        )
      }
    }
    const isDraggingOver = () =>
      uppy
        ?.getPlugin<Dashboard<Record<string, unknown>, Record<string, never>>>(
          'Dashboard',
        )
        ?.getPluginState().isDraggingOver

    // Dragged text (a link, a selection) is not an upload: no drop overlay.
    const text = new DataTransfer()
    text.setData('text/plain', 'https://example.com/')
    drag(['dragover'], text)
    expect(isDraggingOver()).toBeFalsy()

    const files = new DataTransfer()
    files.items.add(new File(['hi'], 'dropped.txt'))
    drag(['dragover'], files)
    expect(isDraggingOver()).toBe(true)
    drag(['drop'], files)
    await expect
      .poll(() => uppy?.getFiles().map((file) => file.name))
      .toEqual(['dropped.txt'])
  })

  it('pins files added after connecting even when earlier files are already queued', async () => {
    const signAssembly = vi.fn(async (params: StoreAssemblyParameters) => ({
      params,
      signature: 'test',
    }))
    setup({ storeUploads: { signAssembly } })
    const app = uppy!
    const storage =
      app.getPlugin<TransloaditStorage<Meta, Record<string, never>>>(
        'TransloaditStorage',
      )!
    app.addFile({ name: 'early.txt', data: new File(['early'], 'early.txt') })
    expect(storage.getPluginState().authenticated).toBeUndefined()
    app
      .getPlugin<Dashboard<Meta, Record<string, never>>>('Dashboard')!
      .showPanel('TransloaditStorage')
    await expect.element(page.getByText('readme.md')).toBeVisible()
    await page.getByText('docs', { exact: true }).click()
    await expect.element(page.getByText('hello.txt')).toBeVisible()
    app.addFile({
      name: 'report.txt',
      data: new File(['report'], 'report.txt'),
    })

    await storage.view.openFolder(storage.rootFolderId)
    await createStoreAssemblyOptions(app, { signAssembly })()

    expect(signAssembly).toHaveBeenCalledOnce()
    expect(signAssembly.mock.calls[0]?.[0].steps.stored.path).toBe(
      `docs/${FILE_NAME}`,
    )
    expect(storage.acceptsFileDrops).toBe(false)
  })

  it('keeps the original folder while retrying a failed postprocessing step', async () => {
    const signAssembly = vi.fn(async (params: StoreAssemblyParameters) => ({
      params,
      signature: 'test',
    }))
    setup({ storeUploads: { signAssembly } })
    const app = uppy!
    const storage =
      app.getPlugin<TransloaditStorage<Meta, Record<string, never>>>(
        'TransloaditStorage',
      )!
    app.addPostProcessor(async () => {})
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await expect.element(page.getByText('readme.md')).toBeVisible()
    await page.getByText('docs', { exact: true }).click()
    await expect.element(page.getByText('hello.txt')).toBeVisible()
    const fileId = app.addFile({
      name: 'report.txt',
      data: new File(['report'], 'report.txt'),
    })
    app.emit('upload-start', [app.getFile(fileId)])
    app.emit('upload-success', app.getFile(fileId), {
      status: 200,
      uploadURL: 'https://example.test/report.txt',
    })
    app.emit('upload-error', app.getFile(fileId), new Error('Storage failed'))
    app.emit('postprocess-complete', app.getFile(fileId))
    await storage.view.openFolder(storage.rootFolderId)
    expect(storage.acceptsFileDrops).toBe(false)
    const assemblyOptions = createStoreAssemblyOptions(app, { signAssembly })
    app.addPreProcessor(async () => {
      await assemblyOptions()
    })

    await app.retryAll()

    expect(signAssembly).toHaveBeenCalledOnce()
    expect(signAssembly.mock.calls[0]?.[0].steps.stored.path).toBe(
      `docs/${FILE_NAME}`,
    )
  })

  it('offers no folder-dependent writes while the next folder is still listing', async () => {
    const onUploadRequest = vi.fn()
    setup({ onUploadRequest })
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await expect.element(page.getByText('readme.md')).toBeVisible()

    // Hold the listing of docs/ until released (then the mock answers it).
    let release = () => {}
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    network.use(
      http.get(`${COMPANION}/transloadit-storage/list/docs%2F`, async () => {
        await held
      }),
    )
    await page.getByText('docs', { exact: true }).click()
    const upload = page.getByRole('button', { name: 'Upload files' })
    await expect.element(upload).toBeDisabled()
    const plugin =
      uppy!.getPlugin<TransloaditStorage<any, any>>('TransloaditStorage')!
    // An impatient second click aborts the first listing: still loading.
    void plugin.view.openFolder('docs%2F')
    await new Promise((resolve) => setTimeout(resolve, 100))
    await expect.element(upload).toBeDisabled()
    // Not through the view either (a headless UI), and not with the root.
    const action = plugin.view.opts.toolbarActions!.find(
      (a) => a.id === 'transloadit:uploadFiles',
    )!
    await plugin.view.runToolbarAction(action)
    expect(onUploadRequest).not.toHaveBeenCalled()

    release()
    await expect.element(page.getByText('hello.txt')).toBeVisible()
    await upload.click()
    expect(onUploadRequest).toHaveBeenCalledWith({ prefix: 'docs/' })
  })

  it('stores queued files in the folder they were added in, and takes no drops while that is unsettled', async () => {
    network.use(
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
    const plugin =
      uppy.getPlugin<TransloaditStorage<any, any>>('TransloaditStorage')!
    const dashboard =
      uppy.getPlugin<Dashboard<Record<string, unknown>, Record<string, never>>>(
        'Dashboard',
      )!
    const storedPath = async () => {
      const build = uppy!.getPlugin<FixtureUploader>('Transloadit')!.opts
        .assemblyOptions as () => Promise<{
        params: { steps: { stored: { path: string } } }
      }>
      return (await build()).params.steps.stored.path
    }
    const fileNames = () => uppy?.getFiles().map((file) => file.name)

    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await expect.element(page.getByText('readme.md')).toBeVisible()

    // While docs/ lists, the panel still has the root open: no drops.
    let release = () => {}
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    network.use(
      http.get(`${COMPANION}/transloadit-storage/list/docs%2F`, async () => {
        await held
      }),
    )
    await page.getByText('docs', { exact: true }).click()
    await vi.waitFor(() => expect(plugin.getPluginState().loading).toBeTruthy())
    expect(plugin.acceptsFileDrops).toBe(false)
    dropFile('too-early.txt')
    expect(fileNames()).toEqual([])
    release()
    await expect.element(page.getByText('hello.txt')).toBeVisible()

    // Added in docs/: stored there, even when the panel is at the root by
    // the time the upload starts.
    dropFile('report.txt')
    await expect.poll(fileNames).toEqual(['report.txt'])
    dashboard.showPanel('TransloaditStorage')
    await plugin.view.openFolder(plugin.rootFolderId)
    // biome-ignore lint/suspicious/noTemplateCurlyInString: a Transloadit placeholder.
    expect(await storedPath()).toBe('docs/${file.name}')
    // New files here would silently join docs/: the panel refuses them.
    expect(plugin.acceptsFileDrops).toBe(false)
    await page.getByRole('button', { name: 'Upload files' }).click()
    expect(uppy.getState().info.map((info) => info.message)).toContain(
      'Upload or remove the queued files first: they go to another folder',
    )

    // Once nothing is queued, the folder open then decides again.
    uppy.clear()
    expect(plugin.acceptsFileDrops).toBe(true)
    dashboard.showPanel('TransloaditStorage')
    await expect.element(page.getByText('readme.md')).toBeVisible()
    dropFile('root.txt')
    await expect.poll(fileNames).toEqual(['root.txt'])
    // biome-ignore lint/suspicious/noTemplateCurlyInString: a Transloadit placeholder.
    expect(await storedPath()).toBe('${file.name}')
  })

  it('guards folder-dependent drops with manually configured Assembly options', async () => {
    const companion = createMockS3Companion({ token: TOKEN })
    network.use(...toMswHandlers(companion, COMPANION, { http }))
    const target = document.createElement('div')
    document.body.appendChild(target)
    uppy = new Uppy()
    const app = uppy
    const signAssembly = vi.fn(async (params: StoreAssemblyParameters) => ({
      params,
      signature: 'test',
    }))
    const assemblyOptions = createStoreAssemblyOptions(app, {
      signAssembly,
      storagePluginId: 'ManagedStorage',
    })
    app
      .use(FixtureUploader, { assemblyOptions })
      .use(Dashboard, { target, inline: true })
      .use(TransloaditStorage, {
        id: 'ManagedStorage',
        companionUrl: COMPANION,
      })
    const storage =
      app.getPlugin<TransloaditStorage<Meta, Record<string, never>>>(
        'ManagedStorage',
      )!
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await expect.element(page.getByText('readme.md')).toBeVisible()
    let release = () => {}
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    network.use(
      http.get(`${COMPANION}/transloadit-storage/list/docs%2F`, async () => {
        await held
      }),
    )
    await page.getByText('docs', { exact: true }).click()
    await vi.waitFor(() =>
      expect(storage.getPluginState().loading).toBeTruthy(),
    )
    expect(storage.acceptsFileDrops).toBe(false)
    dropFile('too-early.txt')
    expect(app.getFiles()).toEqual([])
    release()
    await expect.element(page.getByText('hello.txt')).toBeVisible()
    expect(storage.acceptsFileDrops).toBe(true)
    dropFile('report.txt')
    await expect
      .poll(() => app.getFiles().map((file) => file.name))
      .toEqual(['report.txt'])
    app
      .getPlugin<Dashboard<Meta, Record<string, never>>>('Dashboard')!
      .showPanel('ManagedStorage')
    await storage.view.openFolder(storage.rootFolderId)
    await expect.element(page.getByText('readme.md')).toBeVisible()
    dropFile('wrong-folder.txt')
    expect(app.getFiles().map((file) => file.name)).toEqual(['report.txt'])
    expect(storage.acceptsFileDrops).toBe(false)
    await assemblyOptions()
    expect(signAssembly.mock.calls[0]?.[0].steps.stored.path).toBe(
      `docs/${FILE_NAME}`,
    )
  })

  it('pins the destination before Dashboard asynchronously reads dropped files', async () => {
    const signAssembly = vi.fn(async (params: StoreAssemblyParameters) => ({
      params,
      signature: 'test',
    }))
    setup({ storeUploads: { signAssembly } })
    const app = uppy!
    const storage =
      app.getPlugin<TransloaditStorage<Meta, Record<string, never>>>(
        'TransloaditStorage',
      )!
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await expect.element(page.getByText('readme.md')).toBeVisible()
    await page.getByText('docs', { exact: true }).click()
    await expect.element(page.getByText('hello.txt')).toBeVisible()

    dropFile('report.txt')
    await storage.view.openFolder(storage.rootFolderId)
    await expect
      .poll(() => app.getFiles().map((file) => file.name))
      .toEqual(['report.txt'])
    await createStoreAssemblyOptions(app, { signAssembly })()

    expect(signAssembly.mock.calls[0]?.[0].steps.stored.path).toBe(
      `docs/${FILE_NAME}`,
    )
    expect(storage.acceptsFileDrops).toBe(false)
  })

  it('retains the first signed destination for files added before connecting', async () => {
    const signAssembly = vi.fn(async (params: StoreAssemblyParameters) => ({
      params,
      signature: 'test',
    }))
    setup({ storeUploads: { signAssembly } })
    const app = uppy!
    const storage =
      app.getPlugin<TransloaditStorage<Meta, Record<string, never>>>(
        'TransloaditStorage',
      )!
    const id = app.addFile({
      name: 'early.txt',
      data: new File(['early'], 'early.txt'),
    })
    const build = createStoreAssemblyOptions(app, { signAssembly })
    await build()
    expect(signAssembly.mock.calls[0]?.[0].steps.stored.path).toBe(FILE_NAME)
    app.emit('upload-error', app.getFile(id), new Error('Storage failed'))
    app
      .getPlugin<Dashboard<Meta, Record<string, never>>>('Dashboard')!
      .showPanel('TransloaditStorage')
    await expect.element(page.getByText('readme.md')).toBeVisible()
    await page.getByText('docs', { exact: true }).click()
    await expect.element(page.getByText('hello.txt')).toBeVisible()
    expect(storage.acceptsFileDrops).toBe(false)
    await build()
    expect(signAssembly.mock.calls[1]?.[0].steps.stored.path).toBe(FILE_NAME)
  })

  it('binds files added outside the panel after its folder listing settles', async () => {
    const signAssembly = vi.fn(async (params: StoreAssemblyParameters) => ({
      params,
      signature: 'test',
    }))
    const companion = createMockS3Companion({ token: TOKEN })
    network.use(...toMswHandlers(companion, COMPANION, { http }))
    uppy = new Uppy().use(FixtureUploader, {}).use(TransloaditStorage, {
      companionUrl: COMPANION,
      mode: 'manager',
      storeUploads: { signAssembly },
    })
    const app = uppy!
    const storage =
      app.getPlugin<TransloaditStorage<Meta, Record<string, never>>>(
        'TransloaditStorage',
      )!
    await storage.openFolderPath(null)
    let release = () => {}
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    network.use(
      http.get(`${COMPANION}/transloadit-storage/list/docs%2F`, async () => {
        await held
      }),
    )
    const opening = storage.view.openFolder('docs%2F')
    await vi.waitFor(() =>
      expect(storage.getPluginState().loading).toBeTruthy(),
    )
    app.addFile({
      name: 'outside.txt',
      data: new File(['outside'], 'outside.txt'),
    })
    const build = createStoreAssemblyOptions(app, { signAssembly })
    await expect(build()).rejects.toThrow(
      'Wait for the folder to finish loading',
    )
    expect(signAssembly).not.toHaveBeenCalled()
    release()
    await opening
    expect(storage.getPluginState().currentFolderId).toBe('docs%2F')
    await storage.view.openFolder(storage.rootFolderId)
    await createStoreAssemblyOptions(app, { signAssembly })()
    expect(signAssembly.mock.calls[0]?.[0].steps.stored.path).toBe(
      `docs/${FILE_NAME}`,
    )
  })

  it('keeps the previous folder when navigation is aborted after an external addition', async () => {
    const signAssembly = vi.fn(async (params: StoreAssemblyParameters) => ({
      params,
      signature: 'test',
    }))
    const companion = createMockS3Companion({ token: TOKEN })
    network.use(...toMswHandlers(companion, COMPANION, { http }))
    uppy = new Uppy().use(FixtureUploader, {}).use(TransloaditStorage, {
      companionUrl: COMPANION,
      storeUploads: { signAssembly },
    })
    const app = uppy
    const storage =
      app.getPlugin<TransloaditStorage<Meta, Record<string, never>>>(
        'TransloaditStorage',
      )!
    await storage.openFolderPath(null)
    let release = () => {}
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    network.use(
      http.get(`${COMPANION}/transloadit-storage/list/docs%2F`, async () => {
        await held
      }),
    )
    const opening = storage.view.openFolder('docs%2F')
    await vi.waitFor(() =>
      expect(storage.getPluginState().loading).toBeTruthy(),
    )
    app.addFile({
      name: 'outside.txt',
      data: new File(['outside'], 'outside.txt'),
    })
    app.emit('dashboard:close-panel', 'TransloaditStorage')
    release()
    await opening
    expect(storage.getPluginState().currentFolderId).toBe(storage.rootFolderId)
    await createStoreAssemblyOptions(app, { signAssembly })()
    expect(signAssembly.mock.calls[0]?.[0].steps.stored.path).toBe(FILE_NAME)
  })

  it('binds picker imports before donePicking resets the folder', async () => {
    const signAssembly = vi.fn(async (params: StoreAssemblyParameters) => ({
      params,
      signature: 'test',
    }))
    const companion = createMockS3Companion({ token: TOKEN })
    network.use(...toMswHandlers(companion, COMPANION, { http }))
    uppy = new Uppy().use(FixtureUploader, {}).use(TransloaditStorage, {
      companionUrl: COMPANION,
      storeUploads: { signAssembly },
    })
    const app = uppy
    const storage =
      app.getPlugin<TransloaditStorage<Meta, Record<string, never>>>(
        'TransloaditStorage',
      )!
    await storage.openFolderPath('docs/')
    const item = storage.view
      .getDisplayedPartialTree()
      .find((node) => node.type === 'file')
    if (!item) throw new Error('Missing file in docs')
    storage.view.toggleCheckbox(item, false)
    expect(await storage.view.donePicking()).toBe(true)
    expect(app.getFiles()).toHaveLength(1)
    expect(storage.getPluginState().currentFolderId).toBe(storage.rootFolderId)
    await createStoreAssemblyOptions(app, { signAssembly })()
    expect(signAssembly.mock.calls[0]?.[0].steps.stored.path).toBe(
      `docs/${FILE_NAME}`,
    )
  })

  it('binds external additions after an entire multi-folder navigation finishes', async () => {
    const signAssembly = vi.fn(async (params: StoreAssemblyParameters) => ({
      params,
      signature: 'test',
    }))
    const companion = createMockS3Companion({
      token: TOKEN,
      folders: {
        '': [{ name: 'docs', isFolder: true }],
        'docs/': [{ name: 'photos', isFolder: true }],
        'docs/photos/': [
          { name: 'a.txt', isFolder: false, size: 1, mimeType: 'text/plain' },
        ],
      },
    })
    network.use(...toMswHandlers(companion, COMPANION, { http }))
    uppy = new Uppy().use(FixtureUploader, {}).use(TransloaditStorage, {
      companionUrl: COMPANION,
      mode: 'manager',
      storeUploads: { signAssembly },
    })
    const app = uppy
    const storage =
      app.getPlugin<TransloaditStorage<Meta, Record<string, never>>>(
        'TransloaditStorage',
      )!
    await storage.openFolderPath(null)
    let release = () => {}
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    network.use(
      http.get(`${COMPANION}/transloadit-storage/list/docs%2F`, async () => {
        await held
      }),
    )
    const walking = storage.openFolderPath('docs/photos/')
    await vi.waitFor(() =>
      expect(storage.getPluginState().loading).toBeTruthy(),
    )
    app.addFile({
      name: 'outside.txt',
      data: new File(['outside'], 'outside.txt'),
    })
    release()
    expect(await walking).toBe(true)
    expect(storage.getPluginState().currentFolderId).toBe('docs%2Fphotos%2F')
    await createStoreAssemblyOptions(app, { signAssembly })()
    expect(signAssembly.mock.calls[0]?.[0].steps.stored.path).toBe(
      `docs/photos/${FILE_NAME}`,
    )
  })

  it('refuses a custom upload callback when its shared queue targets another folder', async () => {
    const signAssembly = vi.fn(async (params: StoreAssemblyParameters) => ({
      params,
      signature: 'test',
    }))
    const onUploadRequest = vi.fn()
    setup({ storeUploads: { signAssembly }, onUploadRequest })
    const app = uppy!
    const storage =
      app.getPlugin<TransloaditStorage<Meta, Record<string, never>>>(
        'TransloaditStorage',
      )!
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await expect.element(page.getByText('readme.md')).toBeVisible()
    await page.getByText('docs', { exact: true }).click()
    await expect.element(page.getByText('hello.txt')).toBeVisible()
    app.addFile({
      name: 'queued.txt',
      data: new File(['queued'], 'queued.txt'),
    })
    app
      .getPlugin<Dashboard<Meta, Record<string, never>>>('Dashboard')!
      .showPanel('TransloaditStorage')
    await storage.view.openFolder(storage.rootFolderId)
    await page.getByRole('button', { name: 'Upload files' }).click()
    expect(onUploadRequest).not.toHaveBeenCalled()
    expect(app.getState().info.map((info) => info.message)).toContain(
      'Upload or remove the queued files first: they go to another folder',
    )
  })

  it('reserves local selections before closing a panel that resets its folder', async () => {
    const signAssembly = vi.fn(async (params: StoreAssemblyParameters) => ({
      params,
      signature: 'test',
    }))
    setup({ storeUploads: { signAssembly }, keepStateOnClose: false })
    const app = uppy!
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await expect.element(page.getByText('readme.md')).toBeVisible()
    await page.getByText('docs', { exact: true }).click()
    await expect.element(page.getByText('hello.txt')).toBeVisible()
    const picker = vi
      .spyOn(HTMLInputElement.prototype, 'click')
      .mockImplementation(function (this: HTMLInputElement) {
        const transfer = new DataTransfer()
        transfer.items.add(new File(['picked'], 'picked.txt'))
        this.files = transfer.files
        this.dispatchEvent(new Event('change'))
      })
    try {
      await page.getByRole('button', { name: 'Upload files' }).click()
    } finally {
      picker.mockRestore()
    }
    expect(app.getFiles().map((file) => file.name)).toEqual(['picked.txt'])
    await createStoreAssemblyOptions(app, { signAssembly })()
    expect(signAssembly.mock.calls[0]?.[0].steps.stored.path).toBe(
      `docs/${FILE_NAME}`,
    )
  })

  it('reserves imported files before closing a panel that resets its folder', async () => {
    const signAssembly = vi.fn(async (params: StoreAssemblyParameters) => ({
      params,
      signature: 'test',
    }))
    setup({ storeUploads: { signAssembly }, keepStateOnClose: false })
    const app = uppy!
    const storage =
      app.getPlugin<TransloaditStorage<Meta, Record<string, never>>>(
        'TransloaditStorage',
      )!
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await expect.element(page.getByText('readme.md')).toBeVisible()
    await page.getByText('docs', { exact: true }).click()
    await expect.element(page.getByText('hello.txt')).toBeVisible()
    const item = storage.view
      .getDisplayedPartialTree()
      .find((node) => node.type === 'file')
    if (!item) throw new Error('Missing file in docs')
    storage.view.toggleCheckbox(item, false)
    expect(await storage.view.donePicking()).toBe(true)
    await createStoreAssemblyOptions(app, { signAssembly })()
    expect(signAssembly.mock.calls[0]?.[0].steps.stored.path).toBe(
      `docs/${FILE_NAME}`,
    )
  })

  it('refuses picker imports when the shared queue targets another folder', async () => {
    const signAssembly = vi.fn(async (params: StoreAssemblyParameters) => ({
      params,
      signature: 'test',
    }))
    setup({ storeUploads: { signAssembly } })
    const app = uppy!
    const storage =
      app.getPlugin<TransloaditStorage<Meta, Record<string, never>>>(
        'TransloaditStorage',
      )!
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await expect.element(page.getByText('readme.md')).toBeVisible()
    app.addFile({
      name: 'queued.txt',
      data: new File(['queued'], 'queued.txt'),
    })
    app
      .getPlugin<Dashboard<Meta, Record<string, never>>>('Dashboard')!
      .showPanel('TransloaditStorage')
    await page.getByText('docs', { exact: true }).click()
    await expect.element(page.getByText('hello.txt')).toBeVisible()
    const item = storage.view
      .getDisplayedPartialTree()
      .find((node) => node.type === 'file')
    if (!item) throw new Error('Missing file in docs')
    storage.view.toggleCheckbox(item, false)
    expect(await storage.view.donePicking()).toBe(false)
    expect(app.getFiles().map((file) => file.name)).toEqual(['queued.txt'])
    expect(storage.view.getSelectedAmount()).toBe(1)
    expect(app.getState().info.map((info) => info.message)).toContain(
      'Upload or remove the queued files first: they go to another folder',
    )
  })

  it('refuses to sign a pre-connection queue during navigation', async () => {
    const signAssembly = vi.fn(async (params: StoreAssemblyParameters) => ({
      params,
      signature: 'test',
    }))
    setup({ storeUploads: { signAssembly } })
    const app = uppy!
    const storage =
      app.getPlugin<TransloaditStorage<Meta, Record<string, never>>>(
        'TransloaditStorage',
      )!
    app.addFile({ name: 'early.txt', data: new File(['early'], 'early.txt') })
    app
      .getPlugin<Dashboard<Meta, Record<string, never>>>('Dashboard')!
      .showPanel('TransloaditStorage')
    await expect.element(page.getByText('readme.md')).toBeVisible()
    let release = () => {}
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    network.use(
      http.get(`${COMPANION}/transloadit-storage/list/docs%2F`, async () => {
        await held
      }),
    )
    await page.getByText('docs', { exact: true }).click()
    await vi.waitFor(() =>
      expect(storage.getPluginState().loading).toBeTruthy(),
    )
    const build = createStoreAssemblyOptions(app, { signAssembly })
    await expect(build()).rejects.toThrow(
      'Wait for the folder to finish loading',
    )
    expect(signAssembly).not.toHaveBeenCalled()
    release()
    await expect.element(page.getByText('hello.txt')).toBeVisible()
    await build()
    expect(signAssembly.mock.calls[0]?.[0].steps.stored.path).toBe(
      `docs/${FILE_NAME}`,
    )
  })

  it('blocks folder-dependent toolbar actions throughout paginated path navigation', async () => {
    const onUploadRequest = vi.fn()
    const companion = createMockS3Companion({
      token: TOKEN,
      pageSize: 1,
      folders: {
        '': [
          {
            name: 'readme.md',
            isFolder: false,
            size: 1,
            mimeType: 'text/plain',
          },
          { name: 'docs', isFolder: true },
        ],
        'docs/': [
          { name: 'a.txt', isFolder: false, size: 1, mimeType: 'text/plain' },
        ],
      },
    })
    network.use(...toMswHandlers(companion, COMPANION, { http }))
    uppy = new Uppy().use(TransloaditStorage, {
      companionUrl: COMPANION,
      mode: 'manager',
      onUploadRequest,
    })
    const storage =
      uppy.getPlugin<TransloaditStorage<Meta, Record<string, never>>>(
        'TransloaditStorage',
      )!
    await storage.openFolderPath(null)
    let release = () => {}
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    const load = storage.view.loadNextPage.bind(storage.view)
    const paging = vi
      .spyOn(storage.view, 'loadNextPage')
      .mockImplementation(async () => {
        await held
        return load()
      })
    const walking = storage.openFolderPath('docs/')
    await vi.waitFor(() => expect(paging).toHaveBeenCalled())
    expect(storage.getPluginState().loading).toBeFalsy()
    const upload = storage.view.opts.toolbarActions!.find(
      (action) => action.id === 'transloadit:uploadFiles',
    )!
    await storage.view.runToolbarAction(upload)
    expect(onUploadRequest).not.toHaveBeenCalled()
    const newFolder = storage.view.opts.toolbarActions!.find(
      (action) => action.id === 's3:newFolder',
    )!
    await storage.view.runToolbarAction(newFolder)
    expect(storage.getPluginState().dialog).toBeUndefined()
    release()
    expect(await walking).toBe(true)
    paging.mockRestore()
    await storage.view.runToolbarAction(upload)
    expect(onUploadRequest).toHaveBeenCalledWith({ prefix: 'docs/' })
  })

  it('does not pin an empty queue when a file picker closes without a cancel event', async () => {
    const signAssembly = vi.fn(async (params: StoreAssemblyParameters) => ({
      params,
      signature: 'test',
    }))
    setup({ storeUploads: { signAssembly } })
    const app = uppy!
    const storage =
      app.getPlugin<TransloaditStorage<Meta, Record<string, never>>>(
        'TransloaditStorage',
      )!
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await expect.element(page.getByText('readme.md')).toBeVisible()
    await page.getByText('docs', { exact: true }).click()
    await expect.element(page.getByText('hello.txt')).toBeVisible()
    const picker = vi
      .spyOn(HTMLInputElement.prototype, 'click')
      .mockImplementation(() => {})
    try {
      await page.getByRole('button', { name: 'Upload files' }).click()
    } finally {
      picker.mockRestore()
    }
    await storage.view.openFolder(storage.rootFolderId)
    expect(storage.acceptsFileDrops).toBe(true)
    app.addFile({ name: 'later.txt', data: new File(['later'], 'later.txt') })
    await createStoreAssemblyOptions(app, { signAssembly })()
    expect(signAssembly.mock.calls[0]?.[0].steps.stored.path).toBe(FILE_NAME)
  })

  it('renames a folder in one native move instead of walking it', async () => {
    // Manager mode is headless, as in a file library using `useS3Manager`.
    const companion = createMockS3Companion({ token: TOKEN })
    network.use(...toMswHandlers(companion, COMPANION, { http }))
    uppy = new Uppy().use(TransloaditStorage, {
      companionUrl: COMPANION,
      mode: 'manager',
    })
    const plugin =
      uppy.getPlugin<TransloaditStorage<any, any>>('TransloaditStorage')!
    await plugin.openFolderPath(null)
    const docs = plugin
      .getPluginState()
      .partialTree.find((node) => node.id === 'docs%2F')
    const rename = plugin.view.opts.actions?.find((a) => a.id === 's3:rename')
    if (docs?.type !== 'folder' || !rename) throw new Error('Missing docs')
    const renaming = plugin.view.runAction(rename, docs)
    await vi.waitFor(() => expect(plugin.getPluginState().dialog).toBeDefined())
    plugin.view.submitDialog('archive')
    await renaming

    expect(
      plugin.view.getDisplayedPartialTree().map((item) => item.data.name),
    ).toContain('archive')
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
