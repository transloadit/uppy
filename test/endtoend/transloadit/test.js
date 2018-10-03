/* global browser, expect, capabilities, $ */
const path = require('path')
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
    browser.execute(setTransloaditKeyAndInit, process.env.TRANSLOADIT_KEY)
  })

  it('should upload a file to Transloadit and crop it', () => {
    const inputPath = '#uppy-transloadit .uppy-Dashboard-input'
    const resultPath = '#uppy-result'

    $(inputPath).waitForExist()

    if (supportsChooseFile(capabilities)) {
      browser.execute(unhideTheInput)
      browser.chooseFile(inputPath, path.join(__dirname, '../../resources/image.jpg'))
    } else {
      browser.execute(selectFakeFile, 'uppyTransloadit')
    }
    browser.pause(15000)
    // $('.uppy-StatusBar-actionBtn--upload').click()
    // $(resultPath).waitForExist()
    const text = browser.getText(resultPath)
    expect(text).to.be.equal('ok')
  })
})
