/* global browser, expect, $, $$ */
const testURL = 'http://localhost:4567/create-react-app'

describe('webpack build', () => {
  beforeEach(() => {
    browser.url(testURL)
  })

  it('should include CSS', () => {
    const el = $('#inline-dashboard .uppy-Dashboard-inner')
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
    const el = $('#inline-dashboard .uppy-Dashboard-inner')
    el.waitForExist()

    const tabs = $$('.uppy-DashboardTab-name')
    expect(tabs.some(name => name.getText() === 'Google Drive')).to.equal(true)
  })

  it('should survive being mounted and unmounted', () => {
    const el = $('#inline-dashboard .uppy-Dashboard-inner')
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

describe('React: DashboardModal', () => {
  beforeEach(() => {
    browser.url(testURL)
  })

  it('should have controlled open and close', () => {
    const modalToggle = $('#modal-dashboard-toggle')
    const modalWrapper = $('#modal-dashboard .uppy-Dashboard--modal')
    const modalClose = $('#modal-dashboard .uppy-Dashboard-close')

    expect(modalWrapper.getAttribute('aria-hidden')).to.equal('true')

    modalToggle.click()
    browser.pause(50) // wait for the animation to start

    expect(modalWrapper.getAttribute('aria-hidden')).to.equal(null)

    browser.pause(500) // wait for the animation to complete

    modalClose.click()
    browser.pause(500) // wait for the animation to complete

    expect(modalWrapper.getAttribute('aria-hidden')).to.equal('true')
  })
})
