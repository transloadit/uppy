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

describe('File upload with Instagram Provider', () => {
  beforeEach(async () => {
    await browser.url(testURL)
  })

  // not using arrow functions as cb so to keep mocha in the 'this' context
  it('should upload a file completely with Instagram', async () => {
    if (!process.env.UPPY_INSTAGRAM_USERNAME) {
      console.log('skipping Instagram integration test')
      return this.skip()
    }

    // ensure session is cleared
    await startUploadTest(browser, 'Instagram', /instagram/)
    // do oauth authentication
    const usernameInput = await browser.$('input[name=username]')
    await usernameInput.waitForExist(20000)
    await usernameInput.setValue(process.env.UPPY_INSTAGRAM_USERNAME)
    const passwordInput = await browser.$('input[name=password]')
    await passwordInput.setValue(process.env.UPPY_INSTAGRAM_PASSWORD)
    const submit = await browser.$('form button[type=submit]')
    await submit.click()
    // wait a bit for submission
    await browser.pause(5000)
    if ((await browser.getWindowHandles()).length > 1) {
      // if suspicious login was detected, the window will remain unclosed
      // so we have to input the security code sent
      const challengeChoice = await browser.$('input[name="choice"]')
      if (await challengeChoice.isExisting()) {
        const acceptChallengButton = await browser.$('form button')
        await acceptChallengButton.click()

        const securityCodeInput = await browser.$('input[name=security_code]')
        await securityCodeInput.waitForExist()
        // we can't automate the submission of security code
        // because it is sent to the email. So we wait till it is filled manually
        await securityCodeInput.waitUntil(
          async () => {
            await securityCodeInput.getValue()
          },
          30000, 'expected security code to be manually entered'
        )
      }

      // instagram may ask for auth confirmation to allow companion
      const allowButton = await browser.$('button[value="Authorize"]')
      if (await allowButton.isExisting()) {
        await allowButton.click()
      }
    }

    await finishUploadTest(browser)
  })

  // not using arrow functions as cb so to keep mocha in the 'this' context
  it('should resume uploads when retry is triggered Instagram', async () => {
    if (!process.env.UPPY_INSTAGRAM_USERNAME) {
      console.log('skipping Instagram integration test')
      return this.skip()
    }

    await uploadWithRetry(browser, 'Instagram', testURL)
  })
})
