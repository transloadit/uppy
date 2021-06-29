/* global browser, expect, capabilities  */
const http = require('http')
const { Writable } = require('stream')
const { supportsChooseFile } = require('../utils')

const tempWrite = import('temp-write')
async function make1kBFile () {
  const size = 1024
  const content = Buffer.allocUnsafe(size)
  for (let i = 0; i < size; i++) {
    content[i] = Math.floor(Math.random() * 255)
  }

  return { path: await (await tempWrite).default(content), content }
}

const devNull = () => Writable({
  write (chunk, enc, cb) {
    cb()
  },
})

const testURL = 'http://localhost:4567/xhr-limit'

describe.skip('XHRUpload with `limit`', () => {
  let server = null
  before(() => {
    server = http.createServer((req, res) => {
      res.writeHead(200, {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      })
      req.pipe(devNull())
      req.on('end', () => {
        setTimeout(() => {
          res.end('{"status":"ok"}')
        }, 3000)
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
    const files = await Promise.all(Array.from({ length: 10 }, make1kBFile))

    const endpoint = `http://localhost:${server.address().port}`
    await browser.execute((endpoint) => {
      window.startXHRLimitTest(endpoint)
    }, endpoint)

    if (supportsChooseFile(capabilities)) {
      const input = await browser.$('#uppyXhrLimit .uppy-FileInput-input')
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
            data: new Blob([data], { type: 'text/plain' }),
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
      complete: window.uppyXhrLimit.uploadsComplete,
    }))
    console.log(status)
    expect(status.started).to.be.equal(files.length)
    expect(status.complete).to.be.equal(2)
  })
})
