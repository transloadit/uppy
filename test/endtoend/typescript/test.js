/* global browser, expect  */
describe('Project compiled with Uppy\'s TypeScript typings', () => {
  it('Should have correct imports (thus not crash)', async () => {
    browser.url('http://localhost:4567/typescript')

    const root = await browser.$('.uppy-Root')
    const trigger = await browser.$('#pick-files')
    await root.waitForExist()
    await trigger.click()

    const typeofUppy = await browser.execute(function () {
      return typeof window.uppy
    })
    // It was initialized correctly
    expect(typeofUppy).to.equal('object')

    // The dashboard is shown
    const dashboard = browser.$('.uppy-Dashboard')
    expect(await dashboard.isDisplayed()).to.equal(true)
  })
})
