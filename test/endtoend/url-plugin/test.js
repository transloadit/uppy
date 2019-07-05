/* global browser  */
describe('File upload with URL plugin', () => {
  it('should import  and upload a file completely with Url Plugin', async () => {
    await browser.url('http://localhost:4567/url-plugin')

    // select url plugin
    const urlButton = await browser.$('.uppy-DashboardTab-btn[aria-controls=uppy-DashboardContent-panel--Url]')
    await urlButton.waitForDisplayed(10000)

    await urlButton.click()
    await browser.pause(500)
    // import set url value
    const urlInput = await browser.$('input.uppy-Url-input')
    await urlInput.waitForDisplayed(3000)
    await urlInput.setValue('https://github.com/transloadit/uppy/raw/master/assets/palette.png')
    const importButton = await browser.$('button.uppy-Url-importButton')
    await importButton.click()

    // do the upload
    const uploadButton = await browser.$('.uppy-u-reset.uppy-c-btn.uppy-c-btn-primary.uppy-StatusBar-actionBtn--upload')
    await uploadButton.waitForDisplayed(10000)
    await uploadButton.click()
    const completeStatusBar = await browser.$('.uppy-StatusBar.is-complete')
    await completeStatusBar.waitForExist(20000)
  })
})
