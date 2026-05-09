import Uppy, { type UppyEventMap } from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import { page, userEvent } from '@vitest/browser/context'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect } from 'vitest'
import '@uppy/core/css/style.css'
import '@uppy/dashboard/css/style.css'
import XHRUpload from './index.js'
import { test } from './test-extend.js'

type UploadCompleteResult = Parameters<UppyEventMap<any, any>['complete']>[0]

type MockUploadRequest = {
  fieldNames: string[]
  fileNames: string[]
}

let uppy: Uppy | undefined

function createUppy({ bundle = false }: { bundle?: boolean } = {}) {
  const target = document.createElement('div')
  document.body.appendChild(target)

  uppy = new Uppy({ debug: true })
    .use(Dashboard, {
      target,
      inline: true,
    })
    .use(XHRUpload, {
      endpoint: 'http://localhost/upload',
      bundle,
    })

  return uppy
}

function createMockFile(name: string, size: number = 16) {
  return new File(['a'.repeat(size)], name, { type: 'text/plain' })
}

function waitForUploadComplete(uppy: Uppy<any, any>) {
  return new Promise<UploadCompleteResult>((resolve) =>
    uppy.once('complete', resolve),
  )
}

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  uppy?.destroy()
  uppy = undefined
})

describe('XHRUpload browser mode', () => {
  test('uploads a file in non-bundle mode', async ({ worker }) => {
    const requests: MockUploadRequest[] = []
    worker.use(
      http.post('http://localhost/upload', async ({ request }) => {
        const formData = await request.formData()
        const uploadedFiles = Array.from(formData.entries()).filter(
          (entry): entry is [string, File] => entry[1] instanceof File,
        )

        requests.push({
          fieldNames: uploadedFiles.map(([fieldName]) => fieldName),
          fileNames: uploadedFiles.map(([, file]) => file.name),
        })

        return HttpResponse.json({ url: 'http://localhost/uploads/regular' })
      }),
    )

    const uppy = createUppy()
    const completePromise = waitForUploadComplete(uppy)
    const fileInput = document.querySelector('.uppy-Dashboard-input')!

    await userEvent.upload(fileInput, createMockFile('regular.txt'))
    await page.getByRole('button', { name: 'Upload 1 file' }).click()

    const result = await completePromise

    expect(result.failed).toHaveLength(0)
    expect(result.successful).toHaveLength(1)
    expect(requests).toHaveLength(1)
    expect(requests[0]).toEqual({
      fieldNames: ['file'],
      fileNames: ['regular.txt'],
    })
    expect(uppy.getFiles()[0].response?.uploadURL).toBe(
      'http://localhost/uploads/regular',
    )
    await expect
      .element(page.getByText('Complete', { exact: true }))
      .toBeVisible()
  })

  test('uploads files in a single request with bundle: true', async ({
    worker,
  }) => {
    const requests: MockUploadRequest[] = []
    worker.use(
      http.post('http://localhost/upload', async ({ request }) => {
        const formData = await request.formData()
        const uploadedFiles = Array.from(formData.entries()).filter(
          (entry): entry is [string, File] => entry[1] instanceof File,
        )

        requests.push({
          fieldNames: uploadedFiles.map(([fieldName]) => fieldName),
          fileNames: uploadedFiles.map(([, file]) => file.name),
        })

        return HttpResponse.json({ url: 'http://localhost/uploads/bundled' })
      }),
    )

    const uppy = createUppy({ bundle: true })
    const completePromise = waitForUploadComplete(uppy)
    const fileInput = document.querySelector('.uppy-Dashboard-input')!

    await userEvent.upload(fileInput, [
      createMockFile('bundle-a.txt'),
      createMockFile('bundle-b.txt'),
    ])
    await page.getByRole('button', { name: 'Upload 2 files' }).click()

    const result = await completePromise

    expect(result.failed).toHaveLength(0)
    expect(result.successful).toHaveLength(2)
    expect(requests).toHaveLength(1)
    const sortedFileNames = [...requests[0].fileNames].sort()
    expect(requests[0].fieldNames).toEqual(['files[]', 'files[]'])
    expect(sortedFileNames).toEqual(['bundle-a.txt', 'bundle-b.txt'])
    expect(uppy.getFiles().every((file) => file.response?.uploadURL)).toBe(true)
    await expect
      .element(page.getByText('Complete', { exact: true }))
      .toBeVisible()
  })
})
