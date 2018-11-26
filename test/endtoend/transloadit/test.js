/* global browser, expect, capabilities, $ */
const path = require('path')
const fs = require('fs')
const { selectFakeFile, supportsChooseFile } = require('../utils')

const testURL = 'http://localhost:4567/transloadit'

function unhideTheInput () {
  var input = document.querySelector('#uppy-transloadit .uppy-Dashboard-input')
  input.removeAttribute('hidden')
  input.removeAttribute('aria-hidden')
  input.removeAttribute('tabindex')
}

function setTransloaditKeyAndInit (transloaditKey) {
  window.initUppyTransloadit(transloaditKey)
}

describe('Transloadit file processing', () => {
  beforeEach(() => {
    browser.url(testURL)
  })

  it('should upload a file to Transloadit and crop it', function () {
    const transloaditKey = process.env.TRANSLOADIT_KEY
    if (transloaditKey === undefined) {
      console.log('skipping Transloadit integration test')
      return this.skip()
    }
    browser.execute(setTransloaditKeyAndInit, transloaditKey)

    const inputPath = '#uppy-transloadit .uppy-Dashboard-input'
    const resultPath = '#uppy-result'

    $(inputPath).waitForExist()

    if (supportsChooseFile(capabilities)) {
      browser.execute(unhideTheInput)
      browser.chooseFile(inputPath, path.join(__dirname, '../../resources/image.jpg'))
    } else {
      const img = path.join(__dirname, '../../resources/image.jpg')
      browser.execute(
        selectFakeFile,
        'uppyTransloadit',
        path.basename(img), // name
        `image/jpeg`, // type
        fs.readFileSync(img, 'base64') // b64
      )
      // browser.execute(selectFakeFile, 'uppyTransloadit')
    }
    $(resultPath).waitForExist(25000)
    const text = browser.getText(resultPath)
    expect(text).to.be.equal('ok')
  })
})
