import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import Dropbox from '@uppy/dropbox'
import GoogleDrive from '@uppy/google-drive'
import { ProviderViews } from '@uppy/provider-views'
import { page, userEvent } from '@vitest/browser/context'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { worker } from './setup.js'

import '@uppy/core/css/style.css'
import '@uppy/dashboard/css/style.css'

let uppy: Uppy | undefined

/**
 * In Normal mode (ListItem.tsx), folders are rendered as buttons, whereas files are rendered as checkboxes with a corresponding <label>.
 * In Search mode (SearchListItem.tsx), both files and folders are rendered as buttons.
 * Because of this, in Normal mode, when checking whether a file exists, we need to use:
 * await expect.element(page.getByRole('button', { name:'nested-target.pdf', exact: true }))
 * whereas, in Search mode, we need to scope the query to the checkbox role instead when searching for a file
 */

beforeAll(async () => {
  // Disable search debounce inside ProviderView during tests to avoid long sleeps
  // @ts-expect-error test-only hook
  ProviderViews[Symbol.for('uppy test: searchDebounceMs')] = 0
  await worker.start({
    onUnhandledRequest: 'bypass',
  })
})

afterAll(async () => {
  await worker.stop()
})

type SourceName = 'Dropbox' | 'GoogleDrive'

function initializeUppy(sources: SourceName[] = ['Dropbox']) {
  document.body.innerHTML = '<div id="app"></div>'

  const instance = new Uppy({ id: 'uppy-e2e' }).use(Dashboard, {
    target: '#app',
    inline: true,
    height: 500,
  })

  for (const source of sources) {
    if (source === 'Dropbox') {
      instance.use(Dropbox, { companionUrl: 'http://companion.test' })
    } else if (source === 'GoogleDrive') {
      instance.use(GoogleDrive, { companionUrl: 'http://companion.test' })
    }
  }

  return instance
}

// Removed shared beforeEach initialization. Each test initializes its own Uppy instance.

afterEach(async () => {
  if (!uppy) return

  // this is done to prevent the edgecase when all plugins are removed before dashboard is unmounted from UI
  // causing PickerPanelContent to crash
  const dashboard = uppy.getPlugin('Dashboard')
  dashboard?.hideAllPanels()
  const panelSelector = '[data-uppy-panelType="PickerPanel"]'
  if (document.querySelector(panelSelector)) {
    await expect.poll(() => document.querySelector(panelSelector)).toBeNull()
  }

  uppy.destroy()
  uppy = undefined
})

describe('ProviderView Search E2E', () => {
  test('Search for nested file in Dropbox and verify results', async () => {
    uppy = initializeUppy(['Dropbox'])
    await expect
      .element(page.getByRole('presentation').getByText('Dropbox'))
      .toBeVisible()
    await page.getByRole('tab', { name: 'Dropbox' }).click()

    await expect
      .element(page.getByRole('heading', { name: /import from dropbox/i }))
      .toBeVisible()
    const panel = page.getByRole('tabpanel')
    await expect.element(panel.getByText('test-user@example.com')).toBeVisible()

    const searchInput = document.querySelector(
      '.uppy-ProviderBrowser-searchFilterInput',
    ) as HTMLInputElement
    expect(searchInput).toBeDefined()

    // Search mode (SearchResultItem.tsx): files and folders render as buttons;
    // use role=button for file assertions in search results.
    await userEvent.type(searchInput, 'target')
    await expect
      .element(page.getByRole('button', { name: 'target.pdf', exact: true }))
      .toBeVisible()

    const targetPdfItem = await page.getByRole('button', {
      name: 'target.pdf',
      exact: true,
    })
    expect(targetPdfItem).toBeTruthy()
  })

  test('Search deep folder -> open it -> click ancestor breadcrumb and navigate correctly', async () => {
    uppy = initializeUppy(['Dropbox'])

    await expect
      .element(page.getByRole('presentation').getByText('Dropbox'))
      .toBeVisible()
    await page.getByRole('tab', { name: 'Dropbox' }).click()

    await expect
      .element(page.getByRole('heading', { name: /import from dropbox/i }))
      .toBeVisible()
    const panel = page.getByRole('tabpanel')
    await expect.element(panel.getByText('test-user@example.com')).toBeVisible()

    await expect
      .element(page.getByRole('button', { name: 'first' }))
      .toBeVisible()

    const searchInput = document.querySelector(
      '.uppy-ProviderBrowser-searchFilterInput',
    ) as HTMLInputElement

    await userEvent.clear(searchInput)
    await userEvent.type(searchInput, 'second')

    await expect
      .element(page.getByRole('button', { name: 'second' }))
      .toBeVisible()

    const secondFolder = await page.getByRole('button', { name: 'second' })

    await secondFolder.click()

    // Normal mode (ListItem.tsx): files render as checkboxes with a corresponding <label>.
    // Use role=checkbox for file assertions in browse view.
    await expect
      .element(
        page.getByRole('checkbox', { name: 'deep-file.txt', exact: true }),
      )
      .toBeVisible()

    // Click ancestor breadcrumb that was never loaded before in browse mode
    const firstBreadcrumb = page.getByRole('button', { name: 'first' })
    await firstBreadcrumb.click()

    const hasSecondFolder = await page.getByRole('button', {
      name: 'second',
      exact: true,
    })
    expect(hasSecondFolder).toBeVisible()
  })

  test('Check folder in browse mode, search for nested item -> nested item should be checked', async () => {
    uppy = initializeUppy(['Dropbox'])

    await expect
      .element(page.getByRole('presentation').getByText('Dropbox'))
      .toBeVisible()
    await page.getByRole('tab', { name: 'Dropbox' }).click()

    await expect
      .element(page.getByRole('heading', { name: /import from dropbox/i }))
      .toBeVisible()
    const panel = page.getByRole('tabpanel')
    await expect.element(panel.getByText('test-user@example.com')).toBeVisible()

    await expect
      .element(page.getByRole('button', { name: 'first' }))
      .toBeVisible()

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

    expect(firstFolderCheckbox!.checked).toBe(true)

    const searchInput = document.querySelector(
      '.uppy-ProviderBrowser-searchFilterInput',
    ) as HTMLInputElement
    await userEvent.type(searchInput, 'second')
    await expect
      .element(page.getByRole('button', { name: 'second', exact: true }))
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
  })

  test('Search for nested item, check it, go back to normal view -> parent should be partial', async () => {
    uppy = initializeUppy(['Dropbox'])

    await expect
      .element(page.getByRole('presentation').getByText('Dropbox'))
      .toBeVisible()
    await page.getByRole('tab', { name: 'Dropbox' }).click()

    await expect
      .element(page.getByRole('heading', { name: /import from dropbox/i }))
      .toBeVisible()
    const panel = page.getByRole('tabpanel')
    await expect.element(panel.getByText('test-user@example.com')).toBeVisible()

    await expect
      .element(page.getByRole('button', { name: 'first' }))
      .toBeVisible()

    const searchInput = document.querySelector(
      '.uppy-ProviderBrowser-searchFilterInput',
    ) as HTMLInputElement
    await userEvent.type(searchInput, 'second')
    await expect
      .element(page.getByRole('button', { name: 'second', exact: true }))
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

    expect(secondFolderCheckbox!.checked).toBe(true)

    const clearSearchButton = document.querySelector(
      '.uppy-ProviderBrowser-searchFilterReset',
    ) as HTMLButtonElement
    expect(clearSearchButton).toBeDefined()
    await clearSearchButton.click()

    await expect
      .element(page.getByRole('button', { name: 'first' }))
      .toBeVisible()

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
  })

  test('Search for nested item, check then uncheck it, go back to normal view -> parent should be unchecked', async () => {
    uppy = initializeUppy(['Dropbox'])

    await expect
      .element(page.getByRole('presentation').getByText('Dropbox'))
      .toBeVisible()
    await page.getByRole('tab', { name: 'Dropbox' }).click()

    await expect
      .element(page.getByRole('heading', { name: /import from dropbox/i }))
      .toBeVisible()
    const panel = page.getByRole('tabpanel')
    await expect.element(panel.getByText('test-user@example.com')).toBeVisible()

    await expect
      .element(page.getByRole('button', { name: 'first' }))
      .toBeVisible()

    const searchInput = document.querySelector(
      '.uppy-ProviderBrowser-searchFilterInput',
    ) as HTMLInputElement
    await userEvent.type(searchInput, 'second')
    await expect
      .element(page.getByRole('button', { name: 'second', exact: true }))
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
    expect(secondFolderCheckbox!.checked).toBe(true)

    await secondFolderCheckbox!.click()
    expect(secondFolderCheckbox!.checked).toBe(false)

    const clearSearchButton = document.querySelector(
      '.uppy-ProviderBrowser-searchFilterReset',
    ) as HTMLButtonElement
    expect(clearSearchButton).toBeDefined()
    await clearSearchButton.click()

    await expect
      .element(page.getByRole('button', { name: 'first' }))
      .toBeVisible()

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

    await expect
      .element(page.getByRole('presentation').getByText('Dropbox'))
      .toBeVisible()
    await page.getByRole('tab', { name: 'Dropbox' }).click()

    await expect
      .element(page.getByRole('heading', { name: /import from dropbox/i }))
      .toBeVisible()
    const panel = page.getByRole('tabpanel')
    await expect.element(panel.getByText('test-user@example.com')).toBeVisible()

    await expect
      .element(page.getByRole('button', { name: 'first' }))
      .toBeVisible()

    const firstFolderButton = page.getByRole('button', { name: 'first' })
    await firstFolderButton.click()

    await expect
      .element(page.getByRole('button', { name: 'second' }))
      .toBeVisible()
    // Normal mode (ListItem.tsx): files render as checkboxes with corresponding <label>; scope by role=checkbox. refer to a commment at the top of the file for more detailed explanation.
    await expect
      .element(
        page.getByRole('checkbox', { name: 'intermediate.doc', exact: true }),
      )
      .toBeVisible()

    const searchInput = document.querySelector(
      '.uppy-ProviderBrowser-searchFilterInput',
    ) as HTMLInputElement
    expect(searchInput).toBeDefined()
    await userEvent.type(searchInput, 'target')
    // Search mode (SearchResultItem.tsx): files render as buttons; scope by role=button.
    await expect
      .element(page.getByRole('button', { name: 'target.pdf', exact: true }))
      .toBeVisible()
    await expect
      .element(
        page.getByRole('button', { name: 'nested-target.pdf', exact: true }),
      )
      .toBeVisible()

    const searchResults = Array.from(
      document.querySelectorAll('.uppy-ProviderBrowserItem'),
    )

    const targetFiles = searchResults.filter((item) =>
      item.textContent?.toLowerCase().includes('target'),
    )
    expect(targetFiles.length).toBe(2)
  })

  test('No duplicate items when searching and then browsing to the same file', async () => {
    uppy = initializeUppy(['Dropbox'])

    await expect
      .element(page.getByRole('presentation').getByText('Dropbox'))
      .toBeVisible()
    await page.getByRole('tab', { name: 'Dropbox' }).click()

    await expect
      .element(page.getByRole('heading', { name: /import from dropbox/i }))
      .toBeVisible()
    const panel = page.getByRole('tabpanel')
    await expect.element(panel.getByText('test-user@example.com')).toBeVisible()

    await expect
      .element(page.getByRole('button', { name: 'first' }))
      .toBeVisible()

    // Normal mode (ListItem.tsx): file is a checkbox; assert by role=checkbox. refer to a commment at the top of the file for more detailed explanation.
    await expect
      .element(page.getByRole('checkbox', { name: 'readme.md', exact: true }))
      .toBeVisible()

    const searchInput = document.querySelector(
      '.uppy-ProviderBrowser-searchFilterInput',
    ) as HTMLInputElement
    await userEvent.type(searchInput, 'readme')
    // Search mode (SearchResultItem.tsx): file is a button; assert by role=button.
    await expect
      .element(page.getByRole('button', { name: 'readme.md', exact: true }))
      .toBeVisible()

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
    // proceed to verify browse results directly
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
    expect(readmeCheckbox!.checked).toBe(true)

    // Verify checked state persists after searching again (same node in partialTree)
    await userEvent.clear(searchInput)
    await userEvent.type(searchInput, 'readme')
    await expect
      .element(page.getByRole('button', { name: 'readme.md', exact: true }))
      .toBeVisible()

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

    await expect
      .element(page.getByRole('presentation').getByText('Google Drive'))
      .toBeVisible()
    await page.getByRole('tab', { name: /google drive/i }).click()

    await expect
      .element(page.getByRole('heading', { name: /import from google drive/i }))
      .toBeVisible()
    const panel = page.getByRole('tabpanel')
    await expect.element(panel.getByText('test-user@example.com')).toBeVisible()

    await expect
      .element(page.getByRole('button', { name: 'first' }))
      .toBeVisible()
    await expect
      .element(page.getByRole('checkbox', { name: 'workspace' }))
      .toBeVisible()
    await expect
      .element(page.getByRole('checkbox', { name: 'readme.md' }))
      .toBeVisible()

    const searchInput = document.querySelector(
      '.uppy-ProviderBrowser-searchFilterInput',
    ) as HTMLInputElement
    expect(searchInput).toBeDefined()

    await userEvent.type(searchInput, 'workspace')
    await expect.element(page.getByText('workspace')).toBeVisible()

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
    await expect
      .element(page.getByRole('button', { name: 'first' }))
      .toBeVisible()

    const allItems = Array.from(
      document.querySelectorAll('.uppy-ProviderBrowserItem'),
    )
    expect(allItems.length).toBe(3)

    await userEvent.type(searchInput, 'readme')
    await expect
      .element(page.getByRole('checkbox', { name: 'readme.md' }))
      .toBeVisible()

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
