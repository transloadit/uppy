import Uppy from '@uppy/core'
import { page, userEvent } from '@vitest/browser/context'
import { expect, test } from 'vitest'
import Dashboard from './Dashboard.js'

// Normally you would use one of vitest's framework renderers, such as vitest-browser-react,
// but that's overkill for us so we write our own plain HTML renderer.
function render(html: string) {
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
  const fileInput = document.getElementsByClassName('uppy-Dashboard-input')[0]
  await userEvent.upload(fileInput, new File(['Hello, World!'], 'test.txt'))
  await expect.element(page.getByText('test.txt')).toBeVisible()
  await page.getByTitle('Edit file test.txt').click()
  await userEvent.fill(document.querySelector('fieldset input')!, 'MIT')
  await page.getByText('Save changes').click()
})
