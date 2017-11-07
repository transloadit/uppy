/* global browser, expect, capabilities  */
var path = require('path')

var testURL = 'http://localhost:4567'

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
         capabilities.browserName !== 'MicrosoftEdge'
}

browser.url(testURL)

describe('File upload with DragDrop + Tus, DragDrop + XHRUpload, i18n translated string', () => {
  it('should upload a file with Tus and set progressbar to 100%', () => {
    if (browserSupportsChooseFile(capabilities)) {
      browser.chooseFile('#uppyDragDrop .uppy-DragDrop-input', path.join(__dirname, '../fixtures/image.jpg'))
    } else {
      browser.execute(uppySelectFakeFile, 'uppyDragDrop')
    }
    browser.pause(3000)
    var html = browser.getHTML('#uppyDragDrop-progress .UppyProgressBar-percentage', false)
    expect(parseInt(html)).to.be.equal(100)
  })

  it('should upload a file with XHRUpload and set progressbar to 100%', () => {
    if (browserSupportsChooseFile(capabilities)) {
      browser.chooseFile('#uppyi18n .uppy-DragDrop-input', path.join(__dirname, '../fixtures/image.jpg'))
    } else {
      browser.execute(uppySelectFakeFile, 'uppyi18n')
    }
    browser.pause(3000)
    var html = browser.getHTML('#uppyi18n-progress .UppyProgressBar-percentage', false)
    expect(parseInt(html)).to.be.equal(100)
  })

  it('should translate text strings into Russian', () => {
    var text = browser.getText('#uppyi18n .uppy-DragDrop-label')
    expect(text.trim()).to.be.equal('Перенесите файлы сюда или выберите')
  })
})

  // it('another test', function () {
  //   return browser
  //     .url(uppyTestURL)
  //     .chooseFile('#uppyDragDrop .uppy-DragDrop-input', path.join(__dirname, 'image.jpg'))
  //     .pause(3000)
  //     .getHTML('#uppyDragDrop-progress .UppyProgressBar-percentage', false).then(val => {
  //       console.log(val)
  //       expect(parseInt(val)).toBe(100)
  //     })
  // })
// })
