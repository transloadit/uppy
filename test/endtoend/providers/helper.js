exports.finishUploadTest = async (browser) => {
  // switch back to uppy tab
  await browser.switchWindow(/localhost/)
  const fileItem = await browser.$('.uppy-ProviderBrowser-list li.uppy-ProviderBrowserItem:last-child button')
  await fileItem.waitForDisplayed()
  await fileItem.click()

  const uploadButton = await browser.$('.uppy-ProviderBrowser-footer .uppy-u-reset.uppy-c-btn.uppy-c-btn-primary')
  await uploadButton.click()
  const completeBar = await browser.$('.uppy-StatusBar-content[title="Complete"]')
  await completeBar.waitForDisplayed(20000)
}

exports.startUploadTest = async (browser, providerName, tabMatch) => {
  const providerButton = await browser.$(
    `.uppy-DashboardTab-btn[aria-controls=uppy-DashboardContent-panel--${providerName}]`)
  await providerButton.click()
  await browser.pause(2000)
  const authButton = await browser.$('.uppy-Provider-authBtn')
  await authButton.waitForDisplayed()
  await authButton.click()
  await browser.pause(5000)
  // move control to provider oauth tab
  await browser.switchWindow(tabMatch)
}
