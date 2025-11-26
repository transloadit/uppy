import Uppy, { type UppyEventMap, type UppyOptions } from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import XHRUpload from '@uppy/xhr-upload'
import { page, userEvent } from '@vitest/browser/context'
import { beforeEach, describe, expect } from 'vitest'
import '@uppy/core/css/style.css'
import '@uppy/dashboard/css/style.css'
import { HttpResponse, http } from 'msw'
import GoldenRetriever from './index.js'
import { test } from './test-extend.js'

function createUppy(
  { withPageReload = false }: { withPageReload?: boolean } = {},
  opts?: Partial<UppyOptions<any, any>>,
) {
  if (withPageReload) {
    // simulate page reload
    document.body.innerHTML = ''
  }

  const root = document.createElement('div')
  document.body.appendChild(root)
  return new Uppy({
    debug: true,
  }).use(Dashboard, {
    target: root,
    inline: true,
    ...opts,
  })
}

beforeEach(async () => {
  // @ts-expect-error dunno
  GoldenRetriever[Symbol.for('uppy test: throttleTime')] = 0

  // clear any previously restored files so they don't interfere with tests
  new Uppy().use(GoldenRetriever).clear()
  document.body.innerHTML = ''
})

let fileIndex = 0

const createMockFile = ({
  size,
  name = `${fileIndex++}.txt`,
  type = 'text/plain',
}: {
  name?: string
  size: number
  type?: string
}) => new File(['a'.repeat(size)], name, { type })

describe('Golden retriever', () => {
  test('Restore files', async ({ worker }) => {
    worker.use(
      http.post('http://localhost/upload', () => HttpResponse.json({})),
    )

    let uppy = createUppy().use(GoldenRetriever)

    const fileInput = document.querySelector('.uppy-Dashboard-input')!

    const file = createMockFile({ size: 50000 })
    await userEvent.upload(fileInput, file)

    // reload page and recreate Uppy instance
    uppy = createUppy({ withPageReload: true })
      .use(GoldenRetriever)
      .use(XHRUpload, {
        endpoint: 'http://localhost/upload',
      })
    await new Promise((resolve) => uppy.once('restored', resolve))

    expect(uppy.getFiles().length).toBe(1)
    await expect.element(page.getByText(file.name)).toBeVisible()

    // Start the upload
    await page.getByRole('button', { name: 'Upload 1 file' }).click()

    await expect
      .element(page.getByText('Complete', { exact: true }))
      .toBeVisible()

    // reload page and recreate Uppy instance and wait for golden retriever to initialize
    uppy = createUppy({ withPageReload: true })
    const promise = new Promise<void>((resolve) =>
      uppy.once('plugin-added', (plugin) => {
        if (plugin.id === 'GoldenRetriever') resolve()
      }),
    )
    uppy.use(GoldenRetriever)
    await promise

    // make sure that the restored file is cleared after successful upload
    expect(uppy.getFiles().length).toBe(0)
  })

  test('Should not re-upload completed files', async ({ worker }) => {
    let requestAt = 0
    worker.use(
      http.post('http://localhost/upload', () => {
        if (requestAt === 0) {
          requestAt += 1
          return HttpResponse.json({})
        }
        // fail subsequent requests
        requestAt += 1
        return HttpResponse.json({}, { status: 400 })
      }),
    )

    let uppy = createUppy().use(GoldenRetriever).use(XHRUpload, {
      endpoint: 'http://localhost/upload',
    })

    const fileInput = document.querySelector('.uppy-Dashboard-input')!
    await userEvent.upload(fileInput, [
      createMockFile({ size: 50000 }),
      createMockFile({ size: 50000 }),
    ])

    const uploadFirstFileCompletePromise = new Promise<void>((resolve) =>
      uppy.once('upload-success', () => resolve()),
    )

    const uploadCompletePromise = new Promise<void>((resolve) =>
      uppy.once('complete', () => resolve()),
    )

    // Start the upload
    await page.getByRole('button', { name: 'Upload 2 files' }).click()

    await uploadFirstFileCompletePromise
    await uploadCompletePromise

    // reload page and recreate Uppy instance
    uppy = createUppy({ withPageReload: true })
      .use(GoldenRetriever)
      .use(XHRUpload, {
        endpoint: 'http://localhost/upload',
      })
    await new Promise((resolve) => uppy.once('restored', resolve))

    worker.resetHandlers()

    requestAt = 0 // reset request counter
    worker.use(
      http.post('http://localhost/upload', () => {
        if (requestAt === 0) {
          requestAt += 1
          return HttpResponse.json({})
        }
        // don't allow more than 1 request
        requestAt += 1
        return HttpResponse.json({}, { status: 400 })
      }),
    )

    // Start the upload
    await page.getByRole('button', { name: 'Upload 2 files' }).click()

    await expect
      .element(page.getByText('Complete', { exact: true }))
      .toBeVisible()

    expect(uppy.getFiles().length).toBe(2)
    expect(requestAt).toBe(1) // only the first file upload should have happened so far
  })

  test('Should not clean up files upon completion if there were failed uploads and it should only make the failed file a ghost', async ({
    worker,
  }) => {
    let requestAt = 0
    let respondSecondRequest: (() => void) | undefined
    worker.use(
      http.post('http://localhost/upload', async () => {
        if (requestAt === 0) {
          requestAt += 1
          return HttpResponse.json({})
        }
        await new Promise<void>((resolve) => {
          respondSecondRequest = resolve
        })
        return new HttpResponse({ status: 400 })
      }),
    )

    let uppy = createUppy().use(GoldenRetriever).use(XHRUpload, {
      endpoint: 'http://localhost/upload',
    })

    const fileInput = document.querySelector('.uppy-Dashboard-input')!
    await userEvent.upload(fileInput, [
      createMockFile({ size: 50000 }),
      createMockFile({ size: 50000 }),
    ])

    const uploadFirstFileCompletePromise = new Promise<void>((resolve) =>
      uppy.once('upload-success', () => resolve()),
    )

    // Start the upload
    await page.getByRole('button', { name: 'Upload 2 files' }).click()

    // wait for the first file to finish uploading
    await uploadFirstFileCompletePromise

    // let the second file fail
    respondSecondRequest!()

    const uploadCompletePromise = new Promise<
      Parameters<UppyEventMap<any, any>['complete']>[0]
    >((resolve) => uppy.once('complete', resolve))

    const completedFiles = await uploadCompletePromise
    expect(completedFiles.successful?.length).toBe(1)
    expect(completedFiles.failed?.length).toBe(1)

    const fileIds = uppy.getFiles().map((f) => f.id)

    // Simulate ghosting of the files by deleting it from store(s)
    // @ts-expect-error
    uppy
      .getPlugin('GoldenRetriever')
      [Symbol.for('uppy test: deleteBlobs')](fileIds)

    // reload page and recreate Uppy instance
    uppy = createUppy({ withPageReload: true }).use(GoldenRetriever)
    await new Promise((resolve) => uppy.once('restored', resolve))

    // make sure that the failed files are still there
    expect(uppy.getFiles().length).toBe(2)
    const errorFile = uppy.getFiles().find((f) => f.error)
    expect(errorFile).toBeDefined()
    expect(errorFile!.isGhost).toBeTruthy()

    const successfulFile = uppy
      .getFiles()
      .find((f) => f.progress.uploadComplete)
    expect(successfulFile).toBeDefined()
    // even though the successful file was deleted from store(s), it should not be a ghost
    expect(successfulFile!.isGhost).toBeFalsy()
  })
})
