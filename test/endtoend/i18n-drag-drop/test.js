/* global browser, expect, capabilities  */
var path = require('path')

var testURL = 'http://localhost:4567/i18n-drag-drop'

function uppySelectFakeFile (uppyID) {
  var blob = new Blob(
    ['data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTIwIDEyMCI+CiAgPGNpcmNsZSBjeD0iNjAiIGN5PSI2MCIgcj0iNTAiLz4KPC9zdmc+Cg=='],
    { type: 'image/svg+xml' }
  )
  window[uppyID].addFile({
    source: 'test',
    name: 'test-file',
    type: blob.type,
    data: blob
  })
}

function browserSupportsChooseFile (capabilities) {
  // Webdriver for Safari and Edge doesn’t support .chooseFile
  return capabilities.browserName !== 'safari' &&
         capabilities.browserName !== 'MicrosoftEdge' &&
         capabilities.platformName !== 'Android'
}

describe('File upload with DragDrop + XHRUpload, i18n translated string', () => {
  beforeEach(() => {
    browser.url(testURL)
  })

  it('should upload a file with XHRUpload and set progressbar to 100%', () => {
    if (browserSupportsChooseFile(capabilities)) {
      browser.chooseFile('#uppyi18n .uppy-DragDrop-input', path.join(__dirname, '../../resources/image.jpg'))
    } else {
      browser.execute(uppySelectFakeFile, 'uppyi18n')
    }
    browser.pause(3000)
    var html = browser.getHTML('#uppyi18n-progress .uppy-ProgressBar-percentage', false)
    expect(parseInt(html)).to.be.equal(100)
  })

  it('should translate text strings into Russian', () => {
    var text = browser.getText('#uppyi18n .uppy-DragDrop-label')
    expect(text.trim()).to.be.equal('Перенесите файлы сюда или выберите')
  })
})
