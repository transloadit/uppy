import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import RemoteSources, { type AvailablePluginsKeys } from '@uppy/remote-sources'
import { page, userEvent } from '@vitest/browser/context'
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
} from 'vitest'
import { worker } from './setup.js'

import '@uppy/core/css/style.css'
import '@uppy/dashboard/css/style.css'

let uppy: Uppy

beforeAll(async () => {
  await worker.start({
    onUnhandledRequest: 'bypass',
  })
})

afterAll(async () => {
  await worker.stop()
})

function initializeUppy(sources: AvailablePluginsKeys[] = ['Dropbox']) {
  document.body.innerHTML = '<div id="app"></div>'

  return new Uppy({ id: 'uppy-e2e' })
    .use(Dashboard, {
      target: '#app',
      inline: true,
      height: 500,
    })
    .use(RemoteSources, {
      companionUrl: 'http://companion.test',
      sources,
    })
}

// Removed shared beforeEach initialization. Each test initializes its own Uppy instance.

afterEach(async () => {
  if (uppy) {
    // Small delay to allow Preact cleanup hooks to complete
    await new Promise((resolve) => setTimeout(resolve, 50))
    uppy.destroy()
  }
})

describe('ProviderView Search E2E', () => {
  test('Search for nested file in Dropbox and verify results', async () => {
    uppy = initializeUppy(['Dropbox'])
    await expect.element(page.getByText('My Device')).toBeVisible()
    await page.getByRole('tab', { name: /dropbox/i }).click()
    await expect.element(page.getByText('Import from Dropbox')).toBeVisible()
    await expect.element(page.getByText('test-user@example.com')).toBeVisible()
    await expect.element(page.getByText('first')).toBeVisible()

    const searchInput = document.querySelector(
      '.uppy-ProviderBrowser-searchFilterInput',
    ) as HTMLInputElement
    expect(searchInput).toBeDefined()

    await userEvent.type(searchInput, 'target')

    // Wait for debounce (500ms) + network response
    await new Promise((resolve) => setTimeout(resolve, 600))

    const searchResults = Array.from(
      document.querySelectorAll('.uppy-ProviderBrowserItem'),
    )
    const targetPdfItem = searchResults.find((item) => {
      const button = item.querySelector('button.uppy-ProviderBrowserItem-inner')
      return button?.textContent?.trim() === 'target.pdf'
    })
    expect(targetPdfItem).toBeTruthy()
  })

  test('Search deep folder -> open it -> click ancestor breadcrumb and navigate correctly', async () => {
    uppy = initializeUppy(['Dropbox'])
    await expect.element(page.getByText('My Device')).toBeVisible()

    const dropboxTab = page.getByRole('tab', { name: /dropbox/i })
    await dropboxTab.click()

    await expect.element(page.getByText('first')).toBeVisible()

    const searchInput = document.querySelector(
      '.uppy-ProviderBrowser-searchFilterInput',
    ) as HTMLInputElement
    await userEvent.clear(searchInput)
    await userEvent.type(searchInput, 'second')
    await new Promise((resolve) => setTimeout(resolve, 600))

    const secondFolder = page.getByText('second', { exact: true })
    await secondFolder.click()

    await expect.element(page.getByText('deep-file.txt')).toBeVisible()

    // Click ancestor breadcrumb that was never loaded before in browse mode
    const firstBreadcrumb = page.getByRole('button', { name: 'first' })
    await firstBreadcrumb.click()

    await expect.element(page.getByText('intermediate.doc')).toBeVisible()
    const folderItems = document.querySelectorAll('.uppy-ProviderBrowserItem')
    const hasSecondFolder = Array.from(folderItems).some((item) =>
      item.textContent?.includes('second'),
    )
    expect(hasSecondFolder).toBe(true)
  })

  test('Check folder in browse mode, search for nested item -> nested item should be checked', async () => {
    uppy = initializeUppy(['Dropbox'])
    await expect.element(page.getByText('My Device')).toBeVisible()
    await page.getByRole('tab', { name: /dropbox/i }).click()
    await expect.element(page.getByText('first')).toBeVisible()

    const firstFolderItem = Array.from(
      document.querySelectorAll('.uppy-ProviderBrowserItem'),
    ).find(
      (item) =>
        item.textContent?.includes('first') && item.querySelector('button'),
    )
    const firstFolderCheckbox =
      firstFolderItem?.querySelector<HTMLInputElement>('input[type="checkbox"]')
    expect(firstFolderCheckbox).toBeTruthy()
    await firstFolderCheckbox!.click()

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(firstFolderCheckbox!.checked).toBe(true)

    const searchInput = document.querySelector(
      '.uppy-ProviderBrowser-searchFilterInput',
    ) as HTMLInputElement
    await userEvent.type(searchInput, 'second')
    await new Promise((resolve) => setTimeout(resolve, 600))

    await expect
      .element(page.getByText('second', { exact: true }))
      .toBeVisible()

    const secondFolderItem = Array.from(
      document.querySelectorAll('.uppy-ProviderBrowserItem'),
    ).find((item) => item.textContent?.includes('second'))
    const secondFolderCheckbox =
      secondFolderItem?.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      )
    expect(secondFolderCheckbox).toBeTruthy()

    // Children inherit checked state from parent
    expect(secondFolderCheckbox!.checked).toBe(true)
    expect(
      secondFolderItem?.classList.contains(
        'uppy-ProviderBrowserItem--is-checked',
      ),
    ).toBe(true)
  })

  test('Search for nested item, check it, go back to normal view -> parent should be partial', async () => {
    uppy = initializeUppy(['Dropbox'])
    await expect.element(page.getByText('My Device')).toBeVisible()
    await page.getByRole('tab', { name: /dropbox/i }).click()
    await expect.element(page.getByText('first')).toBeVisible()

    const searchInput = document.querySelector(
      '.uppy-ProviderBrowser-searchFilterInput',
    ) as HTMLInputElement
    await userEvent.type(searchInput, 'second')
    await new Promise((resolve) => setTimeout(resolve, 600))

    await expect
      .element(page.getByText('second', { exact: true }))
      .toBeVisible()

    const secondFolderItem = Array.from(
      document.querySelectorAll('.uppy-ProviderBrowserItem'),
    ).find((item) => item.textContent?.includes('second'))
    const secondFolderCheckbox =
      secondFolderItem?.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      )
    expect(secondFolderCheckbox).toBeTruthy()
    await secondFolderCheckbox!.click()

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(secondFolderCheckbox!.checked).toBe(true)

    const clearSearchButton = document.querySelector(
      '.uppy-ProviderBrowser-searchFilterReset',
    ) as HTMLButtonElement
    expect(clearSearchButton).toBeDefined()
    await clearSearchButton.click()

    await new Promise((resolve) => setTimeout(resolve, 200))
    await expect.element(page.getByText('first')).toBeVisible()

    const firstFolderItem = Array.from(
      document.querySelectorAll('.uppy-ProviderBrowserItem'),
    ).find(
      (item) =>
        item.textContent?.includes('first') && item.querySelector('button'),
    )
    expect(firstFolderItem).toBeTruthy()

    // Parent is partial when some (but not all) children are checked
    expect(
      firstFolderItem?.classList.contains(
        'uppy-ProviderBrowserItem--is-partial',
      ),
    ).toBe(true)

    const firstFolderCheckbox =
      firstFolderItem?.querySelector<HTMLInputElement>('input[type="checkbox"]')
    expect(firstFolderCheckbox).toBeTruthy()
    expect(firstFolderCheckbox!.checked).toBe(false)
  })

  test('Search for nested item, check then uncheck it, go back to normal view -> parent should be unchecked', async () => {
    uppy = initializeUppy(['Dropbox'])
    await expect.element(page.getByText('My Device')).toBeVisible()
    await page.getByRole('tab', { name: /dropbox/i }).click()
    await expect.element(page.getByText('first')).toBeVisible()

    const searchInput = document.querySelector(
      '.uppy-ProviderBrowser-searchFilterInput',
    ) as HTMLInputElement
    await userEvent.type(searchInput, 'second')
    await new Promise((resolve) => setTimeout(resolve, 600))

    await expect
      .element(page.getByText('second', { exact: true }))
      .toBeVisible()

    const secondFolderItem = Array.from(
      document.querySelectorAll('.uppy-ProviderBrowserItem'),
    ).find((item) => item.textContent?.includes('second'))
    const secondFolderCheckbox =
      secondFolderItem?.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      )
    expect(secondFolderCheckbox).toBeTruthy()

    await secondFolderCheckbox!.click()
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(secondFolderCheckbox!.checked).toBe(true)

    await secondFolderCheckbox!.click()
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(secondFolderCheckbox!.checked).toBe(false)

    const clearSearchButton = document.querySelector(
      '.uppy-ProviderBrowser-searchFilterReset',
    ) as HTMLButtonElement
    expect(clearSearchButton).toBeDefined()
    await clearSearchButton.click()

    await new Promise((resolve) => setTimeout(resolve, 200))
    await expect.element(page.getByText('first')).toBeVisible()

    const firstFolderItem = Array.from(
      document.querySelectorAll('.uppy-ProviderBrowserItem'),
    ).find(
      (item) =>
        item.textContent?.includes('first') && item.querySelector('button'),
    )
    expect(firstFolderItem).toBeTruthy()

    expect(
      firstFolderItem?.classList.contains(
        'uppy-ProviderBrowserItem--is-checked',
      ),
    ).toBe(false)
    expect(
      firstFolderItem?.classList.contains(
        'uppy-ProviderBrowserItem--is-partial',
      ),
    ).toBe(false)

    const firstFolderCheckbox =
      firstFolderItem?.querySelector<HTMLInputElement>('input[type="checkbox"]')
    expect(firstFolderCheckbox).toBeTruthy()
    expect(firstFolderCheckbox!.checked).toBe(false)
  })

  test('Navigate into folder and perform scoped search -> should find nested files at multiple levels', async () => {
    uppy = initializeUppy(['Dropbox'])
    await expect.element(page.getByText('My Device')).toBeVisible()
    await page.getByRole('tab', { name: /dropbox/i }).click()
    await expect.element(page.getByText('first')).toBeVisible()

    const firstFolderButton = Array.from(
      document.querySelectorAll('.uppy-ProviderBrowserItem'),
    )
      .find(
        (item) =>
          item.textContent?.includes('first') && item.querySelector('button'),
      )
      ?.querySelector<HTMLButtonElement>(
        'button.uppy-ProviderBrowserItem-inner',
      )
    expect(firstFolderButton).toBeTruthy()
    await firstFolderButton!.click()

    await expect.element(page.getByText('second')).toBeVisible()
    await expect.element(page.getByText('intermediate.doc')).toBeVisible()

    const searchInput = document.querySelector(
      '.uppy-ProviderBrowser-searchFilterInput',
    ) as HTMLInputElement
    expect(searchInput).toBeDefined()
    await userEvent.type(searchInput, 'target')
    await new Promise((resolve) => setTimeout(resolve, 600))

    const searchResults = Array.from(
      document.querySelectorAll('.uppy-ProviderBrowserItem'),
    )

    const targetPdfItem = searchResults.find((item) => {
      const button = item.querySelector('button.uppy-ProviderBrowserItem-inner')
      return button?.textContent?.trim() === 'target.pdf'
    })
    const nestedTargetPdfItem = searchResults.find((item) => {
      const button = item.querySelector('button.uppy-ProviderBrowserItem-inner')
      return button?.textContent?.trim() === 'nested-target.pdf'
    })

    expect(targetPdfItem).toBeTruthy()
    expect(nestedTargetPdfItem).toBeTruthy()

    const targetFiles = searchResults.filter((item) =>
      item.textContent?.toLowerCase().includes('target'),
    )
    expect(targetFiles.length).toBe(2)
  })

  test('No duplicate items when searching and then browsing to the same file', async () => {
    uppy = initializeUppy(['Dropbox'])
    await expect.element(page.getByText('My Device')).toBeVisible()
    await page.getByRole('tab', { name: /dropbox/i }).click()
    await expect.element(page.getByText('first')).toBeVisible()
    await expect.element(page.getByText('readme.md')).toBeVisible()

    const searchInput = document.querySelector(
      '.uppy-ProviderBrowser-searchFilterInput',
    ) as HTMLInputElement
    await userEvent.type(searchInput, 'readme')
    await new Promise((resolve) => setTimeout(resolve, 600))

    const searchResults = Array.from(
      document.querySelectorAll('.uppy-ProviderBrowserItem'),
    )
    const readmeInSearch = searchResults.filter((item) =>
      item.textContent?.includes('readme.md'),
    )
    expect(readmeInSearch.length).toBe(1)

    const clearSearchButton = document.querySelector(
      '.uppy-ProviderBrowser-searchFilterReset',
    ) as HTMLButtonElement
    expect(clearSearchButton).toBeDefined()
    await clearSearchButton.click()
    await new Promise((resolve) => setTimeout(resolve, 500))

    await expect.element(page.getByText('first')).toBeVisible()
    const browseResults = Array.from(
      document.querySelectorAll('.uppy-ProviderBrowserItem'),
    )
    const readmeInBrowse = browseResults.filter((item) =>
      item.textContent?.includes('readme.md'),
    )
    expect(readmeInBrowse.length).toBe(1)

    const readmeCheckbox = readmeInBrowse[0]?.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    )
    expect(readmeCheckbox).toBeTruthy()
    await readmeCheckbox!.click()
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(readmeCheckbox!.checked).toBe(true)

    // Verify checked state persists after searching again (same node in partialTree)
    await userEvent.clear(searchInput)
    await userEvent.type(searchInput, 'readme')
    await new Promise((resolve) => setTimeout(resolve, 600))

    const searchResultsAgain = Array.from(
      document.querySelectorAll('.uppy-ProviderBrowserItem'),
    )
    const readmeInSearchAgain = searchResultsAgain.find((item) =>
      item.textContent?.includes('readme.md'),
    )
    const readmeCheckboxInSearch =
      readmeInSearchAgain?.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      )
    expect(readmeCheckboxInSearch).toBeTruthy()
    expect(readmeCheckboxInSearch!.checked).toBe(true)
  })

  test('Client-side filtering works for providers without server-side search (Google Drive)', async () => {
    uppy = initializeUppy(['GoogleDrive'])

    await expect.element(page.getByText('My Device')).toBeVisible()

    const driveTab = page.getByRole('tab', { name: /google drive/i })
    await driveTab.click()

    await new Promise((resolve) => setTimeout(resolve, 500))

    await expect.element(page.getByText('first')).toBeVisible()
    await expect.element(page.getByText('workspace')).toBeVisible()
    await expect.element(page.getByText('readme.md')).toBeVisible()

    const searchInput = document.querySelector(
      '.uppy-ProviderBrowser-searchFilterInput',
    ) as HTMLInputElement
    expect(searchInput).toBeDefined()

    await userEvent.type(searchInput, 'workspace')
    await new Promise((resolve) => setTimeout(resolve, 300))

    const visibleItems = Array.from(
      document.querySelectorAll('.uppy-ProviderBrowserItem'),
    )

    expect(visibleItems.length).toBe(1)
    const workspaceItem = visibleItems.find((item) =>
      item.textContent?.includes('workspace'),
    )
    expect(workspaceItem).toBeTruthy()

    const firstItem = visibleItems.find((item) => {
      const button = item.querySelector('button.uppy-ProviderBrowserItem-inner')
      return button?.textContent?.trim() === 'first'
    })
    const readmeItem = visibleItems.find((item) =>
      item.textContent?.includes('readme.md'),
    )
    expect(firstItem).toBeUndefined()
    expect(readmeItem).toBeUndefined()

    await userEvent.clear(searchInput)
    await new Promise((resolve) => setTimeout(resolve, 200))

    const allItems = Array.from(
      document.querySelectorAll('.uppy-ProviderBrowserItem'),
    )
    expect(allItems.length).toBe(3)

    await userEvent.type(searchInput, 'readme')
    await new Promise((resolve) => setTimeout(resolve, 300))

    const filteredItems = Array.from(
      document.querySelectorAll('.uppy-ProviderBrowserItem'),
    )
    expect(filteredItems.length).toBe(1)
    const readmeFiltered = filteredItems.find((item) =>
      item.textContent?.includes('readme.md'),
    )
    expect(readmeFiltered).toBeTruthy()
  })
})
