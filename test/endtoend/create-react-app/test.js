/* global browser, expect, $, $$ */
const testURL = 'http://localhost:4567/create-react-app'

describe('webpack build', () => {
  beforeEach(() => {
    browser.url(testURL)
  })

  it('should include CSS', () => {
    const el = $('.uppy-Dashboard-inner')
    el.waitForExist()
    const bgColor = el.getCssProperty('background-color').value
    // computed value is rgb(), not hex (but using a regex here to show the expected value too)
    expect(/^rgb\(250, ?250, ?250\)$|^#fafafa$/.test(bgColor)).to.equal(true)
  })
})

describe('React: Dashboard', () => {
  beforeEach(() => {
    browser.url(testURL)
  })

  it('should have Google Drive panel', () => {
    const el = $('.uppy-Dashboard-inner')
    el.waitForExist()

    const tabs = $$('.uppy-DashboardTab-name')
    expect(tabs.some(name => name.getText() === 'Google Drive')).to.equal(true)
  })

  it('should survive being mounted and unmounted', () => {
    const el = $('.uppy-Dashboard-inner')
    el.waitForExist()

    // close
    browser.click('#inline-dashboard-toggle')
    browser.pause(50)
    // open
    browser.click('#inline-dashboard-toggle')
    browser.pause(50)
    // close
    browser.click('#inline-dashboard-toggle')
    browser.pause(50)
    // open
    browser.click('#inline-dashboard-toggle')
    browser.pause(50)

    // open GDrive panel
    browser.click('.uppy-DashboardTab:nth-child(2)')
    browser.pause(50)

    // side effecting property access, not a function!
    // eslint-disable-next-line no-unused-expressions
    expect($('.uppy-Provider-authBtn')).to.exist
  })
})

describe.skip('React: DashboardModal', () => {
  beforeEach(() => {
    browser.url(testURL)
  })

  it('should upload a file with Tus and set progressbar to 100%', () => {
  })
})
