/* global browser, expect, capabilities  */
const http = require('http')
const tempWrite = require('temp-write')
const { Writable } = require('stream')

const devNull = () => Writable({
  write (chunk, enc, cb) {
    cb()
  }
})

const testURL = 'http://localhost:4567/xhr-limit'

function browserSupportsChooseFile (capabilities) {
  // Webdriver for Safari and Edge doesn’t support .chooseFile
  return capabilities.browserName !== 'safari' &&
         capabilities.browserName !== 'MicrosoftEdge' &&
         capabilities.platformName !== 'Android'
}

describe('XHRUpload with `limit`', () => {
  let server = null
  before(() => {
    server = http.createServer((req, res) => {
      res.writeHead(200, {
        'content-type': 'application/json',
        'access-control-allow-origin': '*'
      })
      req.pipe(devNull())
      req.on('end', () => {
        res.end('{"status":"ok"}')
      })
    }).listen()
  })
  after(() => {
    server.close()
    server = null
  })

  beforeEach(async () => {
    await browser.url(testURL)
  })

  it('should start counting progress for all files', async () => {
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
    await browser.execute((endpoint) => {
      window.startXHRLimitTest(endpoint)
    }, endpoint)

    if (browserSupportsChooseFile(capabilities)) {
      const input = await browser.$('#uppyXhrLimit .uppy-DragDrop-input')
      for (const file of files) {
        await input.setValue(file.path)
      }
    } else {
      await browser.execute((files) => {
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

    await browser.execute(() => {
      window.uppyXhrLimit.upload()
    })
    await browser.pause(5000)
    const status = await browser.execute(() => ({
      started: window.uppyXhrLimit.uploadsStarted,
      complete: window.uppyXhrLimit.uploadsComplete
    })).value
    expect(status.started).to.be.equal(files.length)
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
