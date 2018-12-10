/* global browser, expect  */
describe('Project compiled with Uppy\'s TypeScript typings', () => {
  it('Should have correct imports (thus not crash)', () => {
    browser.url('http://localhost:4567/typescript')

    browser.waitForExist('.uppy-Root')

    const typeofUppy = browser.execute(function () {
      return typeof window.uppy
    })
    // It was initialized correctly
    expect(typeofUppy.value).to.equal('object')

    // The dashboard is shown
    expect(browser.isVisible(`.uppy-Dashboard`)).to.equal(true)
  })
})
