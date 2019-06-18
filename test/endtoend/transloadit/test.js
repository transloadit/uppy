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

  it('should upload a file to Transloadit and crop it', async function () {
    const transloaditKey = process.env.TRANSLOADIT_KEY
    if (transloaditKey === undefined) {
      console.log('skipping Transloadit integration test')
      return this.skip()
    }
    await browser.execute(setTransloaditKeyAndInit, transloaditKey)

    const input = await $('#uppy-transloadit .uppy-Dashboard-input')
    const result = await $('#uppy-result')

    await input.waitForExist()

    if (supportsChooseFile(capabilities)) {
      await browser.execute(unhideTheInput)
      await input.setValue(path.join(__dirname, '../../resources/image.jpg'))
    } else {
      const img = path.join(__dirname, '../../resources/image.jpg')
      await browser.execute(
        selectFakeFile,
        'uppyTransloadit',
        path.basename(img), // name
        `image/jpeg`, // type
        fs.readFileSync(img, 'base64') // b64
      )
      // browser.execute(selectFakeFile, 'uppyTransloadit')
    }
    await result.waitForExist(25000)
    const text = await result.getText()
    expect(text).to.be.equal('ok')
  })
})
