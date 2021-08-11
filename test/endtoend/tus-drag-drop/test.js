/* global browser, expect  */
const path = require('path')
const { selectFakeFile, supportsChooseFile, ensureInputVisible } = require('../utils')

const testURL = 'http://localhost:4567/tus-drag-drop'

describe('File upload with DragDrop + Tus', function test () {
  this.retries(2)

  beforeEach(async () => {
    await browser.url(testURL)
  })

  it('should upload a file with Tus and set progressbar to 100%', async () => {
    await browser.execute(ensureInputVisible, '#uppyDragDrop .uppy-DragDrop-input')

    if (supportsChooseFile()) {
      const input = await browser.$('#uppyDragDrop .uppy-DragDrop-input')
      await input.setValue(path.join(__dirname, '../../resources/image.jpg'))
    } else {
      await browser.execute(selectFakeFile, 'uppyDragDrop')
    }
    await browser.pause(3000)
    const percent = await browser.$('#uppyDragDrop-progress .uppy-ProgressBar-percentage')
    const html = await percent.getHTML(false)
    expect(parseInt(html)).to.be.equal(100)
  })
})
