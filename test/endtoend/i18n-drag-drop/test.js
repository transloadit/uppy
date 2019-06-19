/* global browser, expect, capabilities  */
const path = require('path')
const { selectFakeFile, supportsChooseFile } = require('../utils')

const testURL = 'http://localhost:4567/i18n-drag-drop'

describe('File upload with DragDrop + XHRUpload, i18n translated string', () => {
  beforeEach(async () => {
    await browser.url(testURL)
  })

  it('should upload a file with XHRUpload and set progressbar to 100%', async () => {
    if (supportsChooseFile(capabilities)) {
      const input = await browser.$('#uppyi18n .uppy-DragDrop-input')
      await input.setValue(path.join(__dirname, '../../resources/image.jpg'))
    } else {
      await browser.execute(selectFakeFile, 'uppyi18n')
    }
    await browser.pause(3000)
    const percent = await browser.$('#uppyi18n-progress .uppy-ProgressBar-percentage')
    const html = await percent.getHTML(false)
    expect(parseInt(html)).to.be.equal(100)
  })

  it('should translate text strings into Russian', async () => {
    const label = await browser.$('#uppyi18n .uppy-DragDrop-label')
    const text = await label.getText()
    expect(text.trim()).to.be.equal('Перенесите файлы сюда или выберите')
  })
})
