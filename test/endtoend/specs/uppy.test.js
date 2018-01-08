/* global browser, expect, capabilities  */
var path = require('path')
var http = require('http')
var tempWrite = require('temp-write')

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
         capabilities.browserName !== 'MicrosoftEdge' &&
         capabilities.platformName !== 'Android'
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
    var html = browser.getHTML('#uppyDragDrop-progress .uppy-ProgressBar-percentage', false)
    expect(parseInt(html)).to.be.equal(100)
  })

  it('should upload a file with XHRUpload and set progressbar to 100%', () => {
    if (browserSupportsChooseFile(capabilities)) {
      browser.chooseFile('#uppyi18n .uppy-DragDrop-input', path.join(__dirname, '../fixtures/image.jpg'))
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

describe.only('XHRUpload with `limit`', () => {
  let server = null
  before(() => {
    server = http.createServer((req, res) => {
      res.writeHead(200, {
        'access-control-allow-origin': '*'
      })
      req.pause()
      setTimeout(() => {
        req.resume()
      }, 3000)
      req.on('end', () => {
        res.end('{"status":"ok"}')
      })
    }).listen()
  })
  after(() => {
    server.close()
    server = null
  })

  it('should start counting progress for all files', () => {
    const files = [
      makeFile(1000),
      makeFile(1000),
      makeFile(1000),
      makeFile(1000),
      makeFile(1000),
      makeFile(1000),
      makeFile(1000),
      makeFile(1000),
      makeFile(1000),
      makeFile(1000)
    ]

    const endpoint = `http://localhost:${server.address().port}`
    browser.execute((endpoint) => {
      window.startXHRLimitTest(endpoint)
    }, endpoint)

    if (browserSupportsChooseFile(capabilities)) {
      files.forEach((file) => {
        browser.chooseFile('#uppyXhrLimit .uppy-DragDrop-input', file.path)
      })
    } else {
      browser.execute((files) => {
        files.forEach((data, i) => {
          window.uppyXhrLimit.addFile({
            source: 'test',
            name: `testfile${i}`,
            type: 'text/plain',
            data: new Blob([data], { type: 'text/plain' })
          })
        })
      }, files.map((file) => file.content.toString('hex')))
    }

    browser.execute(() => {
      window.uppyXhrLimit.upload()
    })
    browser.pause(5000)
    const status = browser.execute(() => ({
      started: window.uppyXhrLimit.uploadsStarted,
      complete: window.uppyXhrLimit.uploadsComplete
    })).value
    expect(status.started).to.be.equal(10)
    expect(status.complete).to.be.equal(2)
  })
})

function makeFile (size) {
  const content = Buffer.allocUnsafe(size)
  for (let i = 0; i < size; i++) {
    content[i] = Math.floor(Math.random() * 255)
  }

  return { path: tempWrite.sync(content), content }
}
