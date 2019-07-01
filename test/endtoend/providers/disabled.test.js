/* global browser  */

/*
  WARNING! PLEASE READ THIS BEFORE ENABLING THIS TEST ON TRAVIS.

  Before enabling this test on travis, please keep in mind that with this "no_ssl_bump_domains" option set
  here https://github.com/transloadit/uppy/blob/998c7b1805acb8d305a562dd9726ebae98575e07/.travis.yml#L33
  SSL encryption may not be enabled between the running companion and the testing browser client.

  Hence, provider tokens (Google, Instagram, Dropbox) may be at risk of getting hijacked.
*/
const testURL = 'http://localhost:4567/providers'

describe('File upload with Providers', () => {
  beforeEach(() => {
    // close other tabs that might be left from failed tests
    while (browser.getTabIds().length > 1) {
      browser.switchTab(browser.getTabIds()[1])
      browser.close()
    }

    browser.url(testURL)
  })

  // not using arrow functions as cb so to keep mocha in the 'this' context
  it('should upload a file completely with Google Drive', function () {
    if (process.env.UPPY_GOOGLE_EMAIL == undefined) {
      console.log('skipping Google Drive integration test')
      return this.skip()
    }

    // ensure session is cleared
    startUploadTest(browser, 'GoogleDrive')
    signIntoGoogle(browser)
    finishUploadTest(browser)
  })

  // not using arrow functions as cb so to keep mocha in the 'this' context
  it('should upload a file completely with Instagram', function () {
    const isFirefox = browser.desiredCapabilities.browserName === 'firefox'
    if (process.env.UPPY_INSTAGRAM_USERNAME == undefined || !isFirefox) {
      console.log('skipping Instagram integration test')
      return this.skip()
    }

    // ensure session is cleared
    startUploadTest(browser, 'Instagram')
    // do oauth authentication
    browser.waitForExist('input[name=username]', 20000)
    browser.setValue('input[name=username]', process.env.UPPY_INSTAGRAM_USERNAME)
    browser.setValue('input[name=password]', process.env.UPPY_INSTAGRAM_PASSWORD)
    browser.click('form button[type=submit]')
    if (browser.getTabIds().length > 1) {
      // wait a bit for submission
      browser.pause(3000)
      // if suspicious login was detected, the window will remain unclosed
      // so we have to input the security code sent
      if (browser.isExisting('input[name="choice"]')) {
        browser.click('form button')
        browser.waitForExist('input[name=security_code]')
        // we can't automate the submission of security code
        // because it is sent to the email. So we wait till it is filled manually
        browser.waitUntil(
          () => browser('input[name=security_code]').getValue(),
          30000, 'expected security code to be manually entered')
      }

      // instagram may ask for auth confirmation to allow companion
      if (browser.isExisting('button[value="Authorize"]')) {
        browser.click('button[value="Authorize"]')
      }
    }

    finishUploadTest(browser)
  })

  // not using arrow functions as cb so to keep mocha in the 'this' context
  it('should upload a file completely with Dropbox', function () {
    if (process.env.UPPY_GOOGLE_EMAIL === undefined) {
      console.log('skipping Dropbox integration test')
      return this.skip()
    }

    // ensure session is cleared
    startUploadTest(browser, 'Dropbox')
    // do oauth authentication
    browser.waitForVisible('button.auth-google')
    browser.click('button.auth-google')
    browser.pause(3000)
    // we login with google to avoid captcha
    signIntoGoogle(browser)
    browser.pause(5000)
    // if we dropbox displays a warning about trusting the companion app
    //  we allow it because we trust companion. Companion is our friend.
    if (browser.isExisting('#warning-button-continue')) {
      browser.click('#warning-button-continue')
    }

    browser.pause(3000)
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
  if (browser.isExisting(`li div[data-identifier="${process.env.UPPY_GOOGLE_EMAIL}"]`)) {
    // if user is already signed in, just select user
    browser.click(`li div[data-identifier="${process.env.UPPY_GOOGLE_EMAIL}"]`)
    return
  }

  browser.waitForExist('#identifierId')
  browser.setValue('#identifierId', process.env.UPPY_GOOGLE_EMAIL)
  browser.click('#identifierNext')
  browser.waitForVisible('input[name=password]')
  browser.setValue('input[name=password]', process.env.UPPY_GOOGLE_PASSWORD)
  browser.click('#passwordNext')
  // if suspicious login was detected, the window will remain unclosed
  // so we have to confirm the recovery email or phone no
  if (browser.getTabIds().length > 1) {
    // confirm recovery email option
    if (browser.isExisting('li div[data-challengetype="12"]')) {
      browser.click('li div[data-challengetype="12"]')
      browser.waitForVisible('input[name=knowledgePreregisteredEmailResponse]')
      browser.setValue('input[name=knowledgePreregisteredEmailResponse]', process.env.UPPY_GOOGLE_RECOVERY_EMAIL)
      browser.click('#next[role=button]')
      // confirm recovery phone number
    } else if (browser.isExisting('#countryList')) {
      browser.click('div#countryList')
      browser.click('div[data-value=nl]')
      browser.setValue('input#phoneNumberId', process.env.UPPY_GOOGLE_PHONE_NO)
      browser.click('#next[role=button]')
    }
  }
}
