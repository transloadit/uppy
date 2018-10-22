/* global browser, expect  */
describe('File upload with URL plugin', () => {
  it('should import  and upload a file completely with Url Plugin', () => {
    browser.url('http://localhost:4567/url-plugin')

    const isOnTravis = !!(process.env.TRAVIS && process.env.CI)
    const companionUrl = isOnTravis ? 'http://companion.test:3030' : 'http://localhost:3030'
    browser.execute(function (companionUrl) {
      window.initUrlPlugin(companionUrl)
    }, companionUrl)

    // select url plugin
    browser.click(`.uppy-DashboardTab-btn[aria-controls=uppy-DashboardContent-panel--Url]`)
    // import set url value
    browser.waitForVisible('input.uppy-Url-input', 3000)
    browser.setValue('input.uppy-Url-input', 'https://github.com/transloadit/uppy/raw/master/assets/palette.png')
    browser.click('button.uppy-Url-importButton')

    // do the upload
    browser.waitForVisible('.uppy-u-reset.uppy-c-btn.uppy-c-btn-primary.uppy-StatusBar-actionBtn--upload')
    browser.click('.uppy-u-reset.uppy-c-btn.uppy-c-btn-primary.uppy-StatusBar-actionBtn--upload')
    browser.waitForExist('.uppy-StatusBar.is-complete', 20000)
  })
})
