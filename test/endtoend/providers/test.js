/* global browser, expect  */
const path = require('path')
const { spawn } = require('child_process')
const testURL = 'http://localhost:4567/providers'

describe('File upload with Providers', () => {
  let companion
  function prematureExit () {
    throw new Error('Companion exited early')
  }
  before(() => {
    companion = spawn('node', [
      path.join(__dirname, '../../../packages/@uppy/companion/lib/standalone/start-server')
    ], {
      stdio: 'pipe',
      env: Object.assign({}, process.env, {
        UPPYSERVER_DATADIR: path.join(__dirname, '../../../output'),
        UPPYSERVER_DOMAIN: 'localhost:3020',
        UPPYSERVER_PROTOCOL: 'http',
        UPPYSERVER_PORT: 3020,
        UPPY_ENDPOINTS: '',
        UPPYSERVER_SECRET: 'test'
      })
    })
    return new Promise((resolve, reject) => {
      companion.on('error', reject)
      companion.stdout.on('data', (chunk) => {
        if (`${chunk}`.includes('Listening on')) {
          resolve()
        }
      })

      companion.on('error', console.error)
      companion.stderr.pipe(process.stderr)
      companion.on('exit', prematureExit)
    })
  })
  after(() => {
    return new Promise((resolve) => {
      companion.removeListener('exit', prematureExit)
      companion.on('exit', () => resolve())
      companion.kill('SIGINT')
    })
  })

  beforeEach(() => {
    browser.url(testURL)
  })

  afterEach(() => {
    browser.reload()
  })

  it('should upload a file completely with Google Drive', function () {
    if (process.env.UPPY_GOOGLE_EMAIL === undefined) {
      return this.skip()
    }

    startUploadTest(browser, 'GoogleDrive')
    signIntoGoogle(browser)
    finishUploadTest(browser)
  })

  it('should upload a file completely with Instagram', function () {
    if (process.env.UPPY_INSTAGRAM_USERNAME === undefined) {
      return this.skip()
    }

    startUploadTest(browser, 'Instagram')
    // do oauth authentication
    browser.waitForExist('input[name=username]')
    browser.setValue('input[name=username]', process.env.UPPY_INSTAGRAM_USERNAME)
    browser.setValue('input[name=password]', process.env.UPPY_INSTAGRAM_PASSWORD)
    browser.click('form button')

    finishUploadTest(browser)
  })

  it('should upload a file completely with Dropbox', function () {
    if (process.env.UPPY_GOOGLE_EMAIL === undefined) {
      return this.skip()
    }

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
