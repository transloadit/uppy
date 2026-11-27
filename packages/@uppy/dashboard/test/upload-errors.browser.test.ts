import '@uppy/core/css/style.css'
import '@uppy/dashboard/css/style.css'

import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import { afterEach, expect, test } from 'vitest'
import { page } from 'vitest/browser'

let uppy: Uppy | undefined

afterEach(() => {
  uppy?.destroy()
  uppy = undefined
})

type Outcome = 'fail' | 'succeed' | 'hang'

// A synthetic uploader: each file follows the outcome for its name; a failed
// file succeeds on retry.
function setup({
  outcomes,
  progressBeforeFailure = false,
  hideRetryButton = false,
}: {
  outcomes: Record<string, Outcome>
  progressBeforeFailure?: boolean
  hideRetryButton?: boolean
}) {
  document.body.innerHTML = '<div id="uppy"></div>'
  const instance = new Uppy().use(Dashboard, {
    target: '#uppy',
    inline: true,
    hideRetryButton,
  })
  const failed = new Set<string>()

  instance.addUploader(async (fileIDs) => {
    const files = fileIDs.map((id) => instance.getFile(id))
    instance.emit('upload-start', files)
    await Promise.all(
      files.map(async (file) => {
        const outcome = outcomes[file.name!]
        if (outcome === 'hang') await new Promise(() => {}) // never settles
        if (outcome === 'fail' && !failed.has(file.id)) {
          failed.add(file.id)
          if (progressBeforeFailure) {
            instance.emit('upload-progress', file, {
              uploadStarted: file.progress.uploadStarted!,
              bytesUploaded: file.size! / 2,
              bytesTotal: file.size,
            })
          }
          instance.emit('upload-error', file, new Error('Synthetic failure'))
          return
        }
        instance.emit('upload-success', file, { status: 200, body: {} })
      }),
    )
  })

  for (const name of Object.keys(outcomes)) {
    instance.addFile({ name, type: 'text/plain', data: new Blob(['hello']) })
  }
  uppy = instance
  return instance
}

function title() {
  return document.querySelector('.uppy-DashboardContent-title')?.textContent
}

// The file item's retry button (the status bar's one has no title)
const retryButtons = () => page.getByTitle('Retry upload', { exact: true })

test('heading shows "Error" when the only upload fails', async () => {
  setup({ outcomes: { 'a.txt': 'fail' } }).upload()
  await expect.poll(title).toBe('Error')
})

test('heading shows "Error" when all uploads fail', async () => {
  setup({ outcomes: { 'a.txt': 'fail', 'b.txt': 'fail' } }).upload()
  await expect.poll(title).toBe('Error')
})

test('heading keeps the uploading state while other files still upload', async () => {
  setup({ outcomes: { 'a.txt': 'fail', 'b.txt': 'hang' } }).upload()
  await expect.poll(() => uppy!.getFiles().some((f) => f.error)).toBe(true)
  await expect.poll(title).toMatch(/^Uploading/)
})

test('retry is shown for a file that fails before any progress, and retries it', async () => {
  setup({ outcomes: { 'a.txt': 'fail' } }).upload()
  await expect.element(retryButtons()).toBeVisible()
  expect(uppy!.getFiles()[0]!.progress.percentage).toBeUndefined()

  await retryButtons().click()
  await expect.poll(title).toBe('Upload complete')
})

test('retry is shown for a file that fails after some progress', async () => {
  setup({ outcomes: { 'a.txt': 'fail' }, progressBeforeFailure: true }).upload()
  await expect.element(retryButtons()).toBeVisible()
  expect(uppy!.getFiles()[0]!.progress.percentage).toBe(50)
})

test('retry is hidden with hideRetryButton', async () => {
  setup({ outcomes: { 'a.txt': 'fail' }, hideRetryButton: true }).upload()
  await expect.poll(title).toBe('Error')
  expect(retryButtons().elements()).toHaveLength(0)
})
