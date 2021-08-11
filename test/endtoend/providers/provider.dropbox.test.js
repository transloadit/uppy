/* global browser  */

/*
  WARNING! PLEASE READ THIS BEFORE ENABLING THIS TEST ON TRAVIS.

  Before enabling this test on travis, please keep in mind that with this "no_ssl_bump_domains" option set
  here https://github.com/transloadit/uppy/blob/998c7b1805acb8d305a562dd9726ebae98575e07/.travis.yml#L33
  SSL encryption may not be enabled between the running companion and the testing browser client.

  Hence, provider tokens (Google, Instagram, Dropbox) may be at risk of getting hijacked.
*/
const { finishUploadTest, startUploadTest, uploadWithRetry } = require('./helper')

const testURL = 'http://localhost:4567/providers'

describe('File upload with Dropbox Provider', () => {
  beforeEach(async () => {
    await browser.url(testURL)
  })

  // not using arrow functions as cb so to keep mocha in the 'this' context
  it('should upload a file completely with Dropbox', async function test () {
    if (!process.env.UPPY_GOOGLE_EMAIL) {
      console.log('skipping Dropbox integration test')
      return this.skip()
    }

    // ensure session is cleared
    await startUploadTest(browser, 'Dropbox', /dropbox/)
    // do oauth authentication
    const authButton = await browser.$('button.auth-google')
    await authButton.waitForDisplayed()
    await authButton.click()
    await browser.pause(3000)
    // we login with google to avoid captcha
    await signIntoGoogle(browser)
    await browser.pause(5000)
    // if we dropbox displays a warning about trusting the companion app
    //  we allow it because we trust companion. Companion is our friend.
    const acceptWarning = await browser.$('#warning-button-continue')
    if (await acceptWarning.isExisting()) {
      await acceptWarning.click()
    }

    await browser.pause(3000)
    // finish oauth
    const allowAccessButton = await browser.$('button[name=allow_access]')
    await allowAccessButton.waitForDisplayed()
    await allowAccessButton.click()

    await finishUploadTest(browser)
  })

  // not using arrow functions as cb so to keep mocha in the 'this' context
  it('should resume uploads when retry is triggered with Dropbox', async function test () {
    if (!process.env.UPPY_GOOGLE_EMAIL) {
      console.log('skipping Dropbox integration test')
      return this.skip()
    }

    await uploadWithRetry(browser, 'Dropbox', testURL)
  })
})

const signIntoGoogle = async (browser) => {
  const emailInput = await browser.$('#identifierId')
  await emailInput.waitForExist(30000)
  await emailInput.setValue(process.env.UPPY_GOOGLE_EMAIL)
  let nextButton = await browser.$('#identifierNext')
  await nextButton.click()

  const passwordInput = await browser.$('input[name=password]')
  await passwordInput.waitForDisplayed(30000)
  await passwordInput.setValue(process.env.UPPY_GOOGLE_PASSWORD)
  nextButton = await browser.$('#passwordNext')
  await nextButton.click()
  await browser.pause(3000)

  const emailListItem = await browser.$(`li div[data-identifier="${process.env.UPPY_GOOGLE_EMAIL}"]`)
  if (await emailListItem.isExisting()) {
    // if user is already signed in, just select user
    await emailListItem.click()
  }

  const allowDropboxButton = await browser.$('#submit_approve_access')
  if (await allowDropboxButton.isExisting()) {
    // if dropbox has never been allowed, allow it
    await allowDropboxButton.click()
  }
}
