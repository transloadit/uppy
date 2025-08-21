import Uppy from '@uppy/core'
import { page, userEvent } from '@vitest/browser/context'
import { expect, test } from 'vitest'
import Dashboard from './Dashboard.js'
import '@uppy/core/css/style.css'
import '@uppy/dashboard/css/style.css'

// Normally you would use one of vitest's framework renderers, such as vitest-browser-react,
// but that's overkill for us so we write our own plain HTML renderer.
function render(html: string) {
  document.body.innerHTML = ''
  const root = document.createElement('main')
  root.innerHTML = html
  document.body.appendChild(root)
  return root
}

test('Basic Dashboard functionality works in the browser', async () => {
  render('<div id="uppy"></div>')
  new Uppy().use(Dashboard, {
    target: '#uppy',
    inline: true,
    metaFields: [{ id: 'license', name: 'License' }],
  })

  await expect.element(page.getByText('Drop files here')).toBeVisible()
  const fileInput = document.querySelector(
    '.uppy-Dashboard-input',
  ) as HTMLInputElement
  await userEvent.upload(fileInput, new File(['Hello, World!'], 'test.txt'))
  await expect.element(page.getByText('test.txt')).toBeVisible()
  await page.getByTitle('Edit file test.txt').click()
  const licenseInput = page.getByLabelText('License')
  await expect.element(licenseInput).toBeVisible()
  await userEvent.fill(licenseInput.element(), 'MIT')
  await page.getByText('Save changes').click()
})

test('Upload, pause, and resume functionality', async () => {
  render('<div id="uppy"></div>')

  let uploadResolve: (() => void) | null = null
  const uploadPromise = new Promise<void>((resolve) => {
    uploadResolve = resolve
  })

  let isPaused = false
  let progress = 0

  const uppy = new Uppy({
    // Enable resumable uploads capability for pause/resume functionality
    restrictions: { maxNumberOfFiles: 1 },
  }).use(Dashboard, {
    target: '#uppy',
    inline: true,
    hideProgressAfterFinish: false, // Keep StatusBar visible after completion
  })

  uppy.addUploader(async (fileIDs) => {
    const files = fileIDs.map((id) => uppy.getFile(id))

    // Emit upload-start event
    uppy.emit('upload-start', files)

    // Set initial progress state for all files
    fileIDs.forEach((fileID) => {
      const file = uppy.getFile(fileID)
      if (file) {
        uppy.setFileState(fileID, {
          progress: {
            ...file.progress,
            uploadStarted: null,
            uploadComplete: false,
            percentage: 0,
            bytesUploaded: false,
            bytesTotal: file.size,
          },
        })
      }
    })

    // Simulate upload progress with pause/resume support
    const progressInterval = setInterval(() => {
      fileIDs.forEach((fileID) => {
        const file = uppy.getFile(fileID)
        if (!file) {
          clearInterval(progressInterval)
          return
        }

        // Check if file is paused
        if (file.isPaused) {
          isPaused = true
          return
        } else if (isPaused) {
          // Resuming from pause
          isPaused = false
        }

        // Only progress if not paused
        if (!isPaused && progress < 100) {
          progress += 10

          // Set uploadStarted on first progress update
          const uploadStarted = file.progress.uploadStarted || Date.now()

          uppy.setFileState(fileID, {
            progress: {
              ...file.progress,
              uploadStarted,
              uploadComplete: false,
              percentage: progress,
              bytesUploaded: (progress / 100) * (file.size || 0),
              bytesTotal: file.size || 0,
            },
          })

          // Emit upload-progress event
          uppy.emit('upload-progress', file, {
            uploadStarted,
            bytesUploaded: (progress / 100) * (file.size || 0),
            bytesTotal: file.size || 0,
          })

          if (progress >= 100) {
            clearInterval(progressInterval)

            // Set final progress state
            uppy.setFileState(fileID, {
              progress: {
                ...file.progress,
                uploadComplete: true,
                percentage: 100,
                bytesUploaded: (progress / 100) * (file.size || 0),
                bytesTotal: file.size || 0,
              } as any, // Type assertion to bypass strict union type checking
            })

            // Emit upload-success event
            uppy.emit('upload-success', file, {
              status: 200,
              uploadURL: `https://example.com/upload/${file.name}`,
            })

            uploadResolve?.()
          }
        }
      })
    }, 200) // 200ms intervals for controlled testing

    return uploadPromise
  })

  // Set resumable uploads capability
  uppy.setState({
    capabilities: {
      ...uppy.getState().capabilities,
      resumableUploads: true,
    },
  })

  const fileInput = document.querySelector(
    '.uppy-Dashboard-input',
  ) as HTMLInputElement
  await userEvent.upload(
    fileInput,
    new File(['a'.repeat(50000)], 'test.txt'), // 50KB file
  )

  // Wait for file to be added and upload button to appear
  await expect.element(page.getByText('test.txt')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Upload 1 file' }),
  ).toBeInTheDocument()

  // Start the upload
  await page.getByRole('button', { name: 'Upload 1 file' }).click()

  // Wait for upload to start
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Verify upload has started by checking StatusBar state
  await expect(page.getByText(/Uploading: \d+%/)).toBeVisible()

  // Find and click pause button
  const pauseButton = page.getByTitle('Pause', { exact: true })
  await expect(pauseButton).toBeVisible()
  await pauseButton.click()

  // Find and click resume button
  const resumeButton = page.getByTitle('Resume', { exact: true })
  await expect(resumeButton).toBeVisible()
  await resumeButton.click()

  // Verify upload has resumed and is progressing
  await expect(page.getByText(/Uploading: \d+%/)).toBeVisible()

  // Wait for upload to complete - increase timeout
  await uploadPromise

  // Add a longer delay to allow StatusBar to render final state
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Verify upload completion state using Playwright selector
  await expect(page.getByText('Complete', { exact: true })).toBeVisible()
})
