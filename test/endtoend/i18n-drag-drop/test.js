/* global browser, expect, capabilities  */
const path = require('path')
const { selectFakeFile, supportsChooseFile } = require('../utils')

const testURL = 'http://localhost:4567/i18n-drag-drop'

describe('File upload with DragDrop + XHRUpload, i18n translated string', () => {
  beforeEach(() => {
    browser.url(testURL)
  })

  it('should upload a file with XHRUpload and set progressbar to 100%', () => {
    if (supportsChooseFile(capabilities)) {
      browser.chooseFile('#uppyi18n .uppy-DragDrop-input', path.join(__dirname, '../../resources/image.jpg'))
    } else {
      browser.execute(selectFakeFile, 'uppyi18n')
    }
    browser.pause(3000)
    const html = browser.getHTML('#uppyi18n-progress .uppy-ProgressBar-percentage', false)
    expect(parseInt(html)).to.be.equal(100)
  })

  it('should translate text strings into Russian', () => {
    const text = browser.getText('#uppyi18n .uppy-DragDrop-label')
    expect(text.trim()).to.be.equal('Перенесите файлы сюда или выберите')
  })
})
