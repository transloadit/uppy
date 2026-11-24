import Uppy, { BasePlugin, type Meta, type PluginOpts } from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import {
  createMockS3Companion,
  mockGrant,
  toMswHandlers,
} from '@uppy-dev/s3-mock-companion'
import { HttpResponse, http } from 'msw'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from 'vitest'
import { page } from 'vitest/browser'
import '@uppy/core/css/style.css'
import '@uppy/core/provider-views/css/style.css'
import '@uppy/dashboard/css/style.css'
import '@uppy-dev/msw-setup'
import { network } from 'virtual:msw'
import type { StoreAssemblyParameters } from '../lib/storeAssemblyOptions.js'
import TransloaditStorage, {
  type TransloaditStorageOptions,
} from '../lib/TransloaditStorage.js'

const COMPANION = 'http://localhost:3020'
const TOKEN = 'test-auth-token'
// biome-ignore lint/suspicious/noTemplateCurlyInString: Transloadit’s server-side file placeholder.
const FILE_NAME = '${file.name}'

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
    .use(Dashboard, { target, inline: true })
    .use(TransloaditStorage, { companionUrl: COMPANION, ...options })
  return companion
}

let uppy: Uppy | undefined

class FixtureUploader extends BasePlugin<
  PluginOpts & { assemblyOptions?: unknown; waitForEncoding?: boolean },
  Meta,
  Record<string, never>
> {
  failNextUpload = false
  failAllUploads = false
  uploadGate: Promise<void> | undefined

  #prepare = async (): Promise<void> => {
    if (typeof this.opts.assemblyOptions !== 'function')
      throw new Error('Missing Assembly options')
    await this.opts.assemblyOptions()
  }

  #upload = async (fileIds: string[]): Promise<void> => {
    const fail = this.failNextUpload || this.failAllUploads
    this.failNextUpload = false
    this.uppy.emit('upload-start', this.uppy.getFilesByIds(fileIds))
    await this.uploadGate
    for (const fileId of fileIds) {
      const file = this.uppy.getFile(fileId)
      if (fail)
        this.uppy.emit('upload-error', file, new Error('Fixture upload failed'))
      else this.uppy.emit('upload-success', file, { status: 200, body: {} })
    }
  }

  override install(): void {
    this.uppy.addPreProcessor(this.#prepare)
    this.uppy.addUploader(this.#upload)
  }

  override uninstall(): void {
    this.uppy.removePreProcessor(this.#prepare)
    this.uppy.removeUploader(this.#upload)
  }

  constructor(app: Uppy, options: PluginOpts & { assemblyOptions?: unknown }) {
    super(app, options)
    this.id = options.id ?? 'Transloadit'
    this.type = 'uploader'
  }
}

function setupUploads(options: Partial<TransloaditStorageOptions> = {}) {
  const companion = createMockS3Companion({ token: TOKEN })
  network.use(...toMswHandlers(companion, COMPANION, { http }))
  const target = document.createElement('div')
  document.body.appendChild(target)
  const signAssembly = vi.fn(async (params: StoreAssemblyParameters) => ({
    params,
    signature: 'test',
  }))
  const app = new Uppy()
    .use(FixtureUploader, {})
    .use(Dashboard, { target, inline: true })
    .use(TransloaditStorage, {
      companionUrl: COMPANION,
      storeUploads: { signAssembly },
      ...options,
    })
  uppy = app
  const plugin =
    app.getPlugin<TransloaditStorage<Meta, Record<string, never>>>(
      'TransloaditStorage',
    )
  const uploader = app.getPlugin<FixtureUploader>('Transloadit')
  if (!plugin || !uploader) throw new Error('Missing Storage fixture plugins')
  return { app, plugin, uploader, signAssembly, companion }
}

function dropFile(name: string): void {
  const transfer = new DataTransfer()
  transfer.items.add(new File(['hello'], name, { type: 'text/plain' }))
  const panel = page.getByRole('tabpanel').element()
  panel.dispatchEvent(
    new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      dataTransfer: transfer,
    }),
  )
  panel.dispatchEvent(
    new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer: transfer,
    }),
  )
}

function interceptPicker() {
  const picker: { input: HTMLInputElement | undefined } = { input: undefined }
  vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (
    this: HTMLInputElement,
  ) {
    picker.input = this
  })
  return picker
}

beforeEach(() => {
  document.body.innerHTML = ''
  localStorage.clear()
})

afterEach(() => {
  uppy?.destroy()
  uppy = undefined
  vi.restoreAllMocks()
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

  it('blocks actual drops and upload actions during a delayed folder navigation', async () => {
    const { app, plugin, companion } = setupUploads()
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await expect.element(page.getByText('readme.md')).toBeVisible()
    const started = Promise.withResolvers<void>()
    const release = Promise.withResolvers<void>()
    onTestFinished(() => release.resolve())
    network.use(
      http.get(
        `${COMPANION}/transloadit-storage/list/*`,
        async ({ request }) => {
          started.resolve()
          await release.promise
          const reply = companion.handle({
            method: 'GET',
            url: request.url,
            token: request.headers.get('uppy-auth-token'),
          })
          if (!reply) throw new Error('Unexpected Companion request')
          return new HttpResponse(JSON.stringify(reply.body), {
            status: reply.status,
            headers: { 'Content-Type': 'application/json' },
          })
        },
      ),
    )
    const navigation = plugin.openFolderPath('docs/')
    await started.promise
    await expect
      .element(page.getByRole('button', { name: 'Upload files' }))
      .not.toBeInTheDocument()
    dropFile('blocked.txt')
    expect(app.getFiles()).toEqual([])
    release.resolve()
    await navigation
    await expect.element(page.getByText('hello.txt')).toBeVisible()
    await expect
      .element(page.getByRole('button', { name: 'Upload files' }))
      .toBeVisible()
    expect(app.getFiles()).toEqual([])
  })

  it('preserves the destination of files selected inside Storage while it collects them', async () => {
    const { app, plugin, signAssembly } = setupUploads()
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await plugin.openFolderPath('docs/')
    await page.getByRole('checkbox', { name: 'hello.txt' }).click()
    await page.getByRole('button', { name: 'Select 1' }).click()
    await expect.poll(() => app.getFiles().length).toBe(1)
    await app.upload()
    expect(signAssembly).toHaveBeenCalledWith(
      expect.objectContaining({
        steps: {
          stored: expect.objectContaining({ path: `docs/${FILE_NAME}` }),
        },
      }),
    )
  })

  it('captures a Dashboard drop before closing the panel resets its folder', async () => {
    const { app, plugin, signAssembly } = setupUploads({
      keepStateOnClose: false,
    })
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await plugin.openFolderPath('docs/')
    dropFile('reset-on-close.txt')
    await expect.poll(() => app.getFiles().length).toBe(1)
    await app.upload()
    expect(signAssembly).toHaveBeenCalledWith(
      expect.objectContaining({
        steps: {
          stored: expect.objectContaining({ path: `docs/${FILE_NAME}` }),
        },
      }),
    )
  })

  it('signs Dashboard drops for their acceptance folder after navigating away', async () => {
    const { app, plugin, signAssembly } = setupUploads()
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await plugin.openFolderPath('docs/')
    await expect.element(page.getByText('hello.txt')).toBeVisible()
    dropFile('accepted.txt')
    await expect
      .poll(() => app.getFiles().map((file) => file.source))
      .toEqual(['Dashboard'])
    await plugin.openFolderPath('')
    await app.upload()
    expect(signAssembly).toHaveBeenCalledWith(
      expect.objectContaining({
        steps: {
          stored: expect.objectContaining({ path: `docs/${FILE_NAME}` }),
        },
      }),
    )
  })

  it('uses a fresh destination for the next batch while successful files remain queued', async () => {
    const { app, plugin, signAssembly } = setupUploads()
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await plugin.openFolderPath('docs/')
    dropFile('first.txt')
    await expect.poll(() => app.getFiles().length).toBe(1)
    await app.upload()
    expect(app.getFiles()[0]?.progress.complete).toBe(true)
    await page.getByRole('button', { name: 'Add more files' }).click()
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await plugin.openFolderPath('')
    dropFile('second.txt')
    await expect.poll(() => app.getFiles().length).toBe(2)
    await app.upload()
    expect(signAssembly).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        steps: {
          stored: expect.objectContaining({ path: `docs/${FILE_NAME}` }),
        },
      }),
    )
    expect(signAssembly).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        steps: { stored: expect.objectContaining({ path: FILE_NAME }) },
      }),
    )
  })

  it('keeps the failed file’s destination when retried from another folder', async () => {
    const { app, plugin, uploader, signAssembly } = setupUploads({
      reopenAfterUpload: true,
    })
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await plugin.openFolderPath('docs/')
    dropFile('retry.txt')
    await expect.poll(() => app.getFiles().length).toBe(1)
    uploader.failNextUpload = true
    expect((await app.upload())?.failed).toHaveLength(1)
    await plugin.openFolderPath('')
    expect((await app.retryAll())?.successful).toHaveLength(1)
    expect(signAssembly).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        steps: {
          stored: expect.objectContaining({ path: `docs/${FILE_NAME}` }),
        },
      }),
    )
    await expect.poll(() => app.getFiles().length).toBe(0)
    await expect.poll(() => plugin.getPluginState().loading).toBe(false)
  })

  it('refuses overlapping retries without signing them for a running batch’s folder', async () => {
    const { app, plugin, uploader, signAssembly } = setupUploads()
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await plugin.openFolderPath('docs/')
    dropFile('failed-docs.txt')
    await expect.poll(() => app.getFiles().length).toBe(1)
    uploader.failNextUpload = true
    const first = await app.upload()
    const failedFile = first?.failed?.[0]
    if (!failedFile) throw new Error('Expected a failed file')
    await page.getByRole('button', { name: 'Add more files' }).click()
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await plugin.openFolderPath('')
    dropFile('running-root.txt')
    await expect.poll(() => app.getFiles().length).toBe(2)
    // upload() retries existing failures before starting newly queued files.
    uploader.failAllUploads = true
    await app.upload()
    uploader.failAllUploads = false
    const rootFile = app
      .getFiles()
      .find((file) => file.name === 'running-root.txt')
    if (!rootFile) throw new Error('Expected the root file')
    const release = Promise.withResolvers<void>()
    uploader.uploadGate = release.promise
    const running = app.retryUpload(rootFile.id)
    try {
      await expect.poll(() => signAssembly.mock.calls.length).toBe(4)
      await expect(app.retryUpload(failedFile.id)).rejects.toThrow(
        'Wait for the running upload',
      )
      expect(signAssembly).toHaveBeenCalledTimes(4)
    } finally {
      release.resolve()
      await running
    }
    await app.retryUpload(failedFile.id)
    expect(signAssembly).toHaveBeenLastCalledWith(
      expect.objectContaining({
        steps: {
          stored: expect.objectContaining({ path: `docs/${FILE_NAME}` }),
        },
      }),
    )
  })

  it('does not retain a destination when the native picker is cancelled', async () => {
    const { app, plugin, signAssembly } = setupUploads()
    const picker = interceptPicker()
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await plugin.openFolderPath('docs/')
    await page.getByRole('button', { name: 'Upload files' }).click()
    if (!picker.input) throw new Error('Picker did not open')
    picker.input.dispatchEvent(new Event('cancel'))
    await plugin.openFolderPath('')
    dropFile('after-cancel.txt')
    await expect.poll(() => app.getFiles().length).toBe(1)
    await app.upload()
    expect(signAssembly).toHaveBeenCalledWith(
      expect.objectContaining({
        steps: { stored: expect.objectContaining({ path: FILE_NAME }) },
      }),
    )
  })

  it('keeps the picker’s original folder when navigation happens before selection', async () => {
    const { app, plugin, signAssembly } = setupUploads()
    const picker = interceptPicker()
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await plugin.openFolderPath('docs/')
    await page.getByRole('button', { name: 'Upload files' }).click()
    if (!picker.input) throw new Error('Picker did not open')
    const input = picker.input
    await plugin.openFolderPath('')
    const transfer = new DataTransfer()
    transfer.items.add(new File(['hello'], 'picked.txt'))
    input.files = transfer.files
    input.dispatchEvent(new Event('change'))
    await app.upload()
    expect(signAssembly).toHaveBeenCalledWith(
      expect.objectContaining({
        steps: {
          stored: expect.objectContaining({ path: `docs/${FILE_NAME}` }),
        },
      }),
    )
  })

  it('forgets a removed file’s destination before accepting the next batch', async () => {
    const { app, plugin, signAssembly } = setupUploads()
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await plugin.openFolderPath('docs/')
    dropFile('removed.txt')
    await expect.poll(() => app.getFiles().length).toBe(1)
    app.removeFiles(app.getFiles().map((file) => file.id))
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await plugin.openFolderPath('')
    dropFile('replacement.txt')
    await expect.poll(() => app.getFiles().length).toBe(1)
    await app.upload()
    expect(signAssembly).toHaveBeenCalledWith(
      expect.objectContaining({
        steps: { stored: expect.objectContaining({ path: FILE_NAME }) },
      }),
    )
  })

  it('refuses to sign one Assembly for files accepted in different folders', async () => {
    const { app, plugin, signAssembly } = setupUploads()
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await plugin.openFolderPath('docs/')
    dropFile('docs.txt')
    await expect.poll(() => app.getFiles().length).toBe(1)
    await page.getByRole('button', { name: 'Add more files' }).click()
    await page.getByRole('tab', { name: 'Transloadit Storage' }).click()
    await plugin.openFolderPath('')
    dropFile('root.txt')
    await expect.poll(() => app.getFiles().length).toBe(2)
    await expect(app.upload()).rejects.toThrow(
      'Upload files from one folder at a time',
    )
    expect(signAssembly).not.toHaveBeenCalled()
  })
})
