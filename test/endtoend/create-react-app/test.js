/* global browser, expect, $, $$ */
const testURL = 'http://localhost:4567/create-react-app'

describe('webpack build', () => {
  beforeEach(async () => {
    await browser.url(testURL)
  })

  it('should include CSS', async () => {
    const el = await $('#inline-dashboard .uppy-Dashboard-inner')
    await el.waitForExist()
    const bgColor = await el.getCSSProperty('background-color')
    // computed value is rgb() or rgba(), not hex (but listing it here to show the expected value too)
    expect(/^rgba?\(250, ?250, ?250(?:, ?1)?\)$|^#fafafa$/.test(bgColor.value)).to.equal(true)
  })
})

describe('React: Dashboard', () => {
  beforeEach(async () => {
    await browser.url(testURL)
  })

  it('should have Google Drive panel', async () => {
    const el = await $('#inline-dashboard .uppy-Dashboard-inner')
    await el.waitForExist()

    const tabs = await $$('.uppy-DashboardTab-name')
    let hasGDrive = false
    for (const name of tabs) {
      hasGDrive = (await name.getText()) === 'Google Drive'
      if (hasGDrive) break
    }
    expect(hasGDrive).to.equal(true)
  })

  it('should survive being mounted and unmounted', async () => {
    const el = await $('#inline-dashboard .uppy-Dashboard-inner')
    await el.waitForExist()

    async function toggle () {
      const button = await $('#inline-dashboard-toggle')
      await button.click()
      await browser.pause(250)
    }

    // close
    await toggle()
    // open
    await toggle()
    // close
    await toggle()
    // open
    await toggle()

    // open GDrive panel
    const gdriveButton = await $('.uppy-DashboardTab:nth-child(2) button')
    await gdriveButton.click()
    await browser.pause(500)

    // side effecting property access, not a function!
    // eslint-disable-next-line no-unused-expressions
    expect(await $('.uppy-Provider-authBtn')).to.exist
  })
})

describe('React: DashboardModal', () => {
  beforeEach(async () => {
    await browser.url(testURL)
  })

  it('should have controlled open and close', async () => {
    const modalToggle = await $('#modal-dashboard-toggle')
    const modalWrapper = await $('#modal-dashboard .uppy-Dashboard--modal')
    const modalClose = await $('#modal-dashboard .uppy-Dashboard-close')

    await modalToggle.waitForExist()

    expect(await modalWrapper.getAttribute('aria-hidden')).to.equal('true')

    await modalToggle.click()
    await browser.pause(50) // wait for the animation to start

    // Edge appears to report empty string while others report null
    expect(await modalWrapper.getAttribute('aria-hidden')).to.be.oneOf([null, ''])

    await browser.pause(500) // wait for the animation to complete

    await modalClose.click()
    await browser.pause(500) // wait for the animation to complete

    expect(await modalWrapper.getAttribute('aria-hidden')).to.equal('true')
  })
})
