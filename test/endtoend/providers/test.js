/* global browser, expect  */
const testURL = 'http://localhost:4567/providers'

describe('File upload with Providers', () => {
  beforeEach(() => {
    browser.url(testURL)
  })

  afterEach(() => {
    browser.reload()
  })

  it('should upload a file completely with Google Drive', () => {
    startUploadTest(browser, 'GoogleDrive')
    signIntoGoogle(browser)
    finishUploadTest(browser)
  })

  it('should upload a file completely with Instagram', () => {
    startUploadTest(browser, 'Instagram')
    // do oauth authentication
    browser.waitForExist('input[name=username]')
    browser.setValue('input[name=username]', process.env.UPPY_INSTAGRAM_USERNAME)
    browser.setValue('input[name=password]', process.env.UPPY_INSTAGRAM_PASSWORD)
    browser.click('button')

    finishUploadTest(browser)
  })

  it('should upload a file completely with Dropbox', () => {
    startUploadTest(browser, 'Dropbox')
    // do oauth authentication
    browser.waitForVisible('button.auth-google')
    browser.click('button.auth-google')
    // we login with google to avoid captcha
    signIntoGoogle(browser)
    // finish oauth
    browser.waitForVisible('button[name=allow_access]')
    browser.click('button[name=allow_access]')

    finishUploadTest(browser)
  })
})

const startUploadTest = (browser, providerName) => {
  browser.click(`.uppy-DashboardTab-btn[aria-controls=uppy-DashboardContent-panel--${providerName}]`)
  browser.waitForVisible('.uppy-Provider-authBtn', 3000)
  browser.click('.uppy-Provider-authBtn')
  // move control to instagram auth tab
  browser.switchTab(browser.getTabIds()[1])
}

const finishUploadTest = (browser) => {
  // switch back to uppy tab
  browser.switchTab(browser.getTabIds()[0])
  browser.waitForVisible('.uppy-ProviderBrowser-list li.uppy-ProviderBrowserItem')
  browser.click('.uppy-ProviderBrowser-list li.uppy-ProviderBrowserItem:last-child button')

  browser.waitForVisible('.uppy-ProviderBrowser-footer .uppy-u-reset.uppy-c-btn.uppy-c-btn-primary')
  browser.click('.uppy-ProviderBrowser-footer .uppy-u-reset.uppy-c-btn.uppy-c-btn-primary')
  browser.waitForVisible('.uppy-StatusBar-content[title="Complete"]', 20000)
}

const signIntoGoogle = (browser) => {
  browser.waitForExist('#identifierId')
  browser.setValue('#identifierId', process.env.UPPY_GOOGLE_EMAIL)
  browser.click('#identifierNext')
  browser.waitForVisible('input[name=password]')
  browser.setValue('input[name=password]', process.env.UPPY_GOOGLE_PASSWORD)
  browser.click('#passwordNext')
}
