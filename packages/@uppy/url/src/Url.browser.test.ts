import Uppy from '@uppy/core'
import { page, userEvent } from '@vitest/browser/context'
import { expect, test } from 'vitest'
import Url from './Url.js'

// Normally you would use one of vitest's framework renderers, such as vitest-browser-react,
// but that's overkill for us so we write our own plain HTML renderer.
function render(html: string) {
  document.body.innerHTML = ''
  const root = document.createElement('main')
  root.innerHTML = html
  document.body.appendChild(root)
  return root
}

test('should return correct file name with URL plugin from remote image with Content-Disposition', async () => {
  render('<div id="uppy"></div>')
  const uppy = new Uppy().use(Url, {
    companionUrl: 'http://localhost:3020',
    target: '#uppy',
  })

  const mockServerUrl = 'http://localhost:62450'
  await page
    .getByPlaceholder('Enter URL to import a file')
    .fill(`${mockServerUrl}/file-with-content-disposition`)
  await page.getByText('Import').click()
  await new Promise((resolve) => setTimeout(resolve, 500))
  await uppy.upload()

  const file = uppy.getFiles()[0]
  expect(file.name).toBe('DALL·E IMG_9078 - 学中文 🤑')
  expect(file.type).toBe('image/jpeg')
  expect(file.size).toBe(86500)
})

test('should return correct file name with URL plugin from remote image without Content-Disposition', async () => {
  render('<div id="uppy"></div>')
  const uppy = new Uppy().use(Url, {
    companionUrl: 'http://localhost:3020',
    target: '#uppy',
  })

  const mockServerUrl = 'http://localhost:62450'
  await page
    .getByPlaceholder('Enter URL to import a file')
    .fill(`${mockServerUrl}/file-no-headers`)
  await page.getByText('Import').click()
  await new Promise((resolve) => setTimeout(resolve, 500))
  await uppy.upload()

  const file = uppy.getFiles()[0]
  expect(file, 'file does not exist').toBeTruthy()
  expect(file.name).toBe('file-no-headers')
  expect(file.type).toBe('application/octet-stream')
  expect(file.size).toBeNull()
})
