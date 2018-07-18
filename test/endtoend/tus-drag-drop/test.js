/* global browser, expect  */
const path = require('path')
const { selectFakeFile, supportsChooseFile } = require('../utils')

const testURL = 'http://localhost:4567/tus-drag-drop'

describe('File upload with DragDrop + Tus', () => {
  beforeEach(() => {
    browser.url(testURL)
  })

  it('should upload a file with Tus and set progressbar to 100%', () => {
    if (supportsChooseFile()) {
      browser.chooseFile('#uppyDragDrop .uppy-DragDrop-input', path.join(__dirname, '../../resources/image.jpg'))
    } else {
      browser.execute(selectFakeFile, 'uppyDragDrop')
    }
    browser.pause(3000)
    const html = browser.getHTML('#uppyDragDrop-progress .uppy-ProgressBar-percentage', false)
    expect(parseInt(html)).to.be.equal(100)
  })
})
