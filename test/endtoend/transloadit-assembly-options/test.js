/* global browser, expect, capabilities, $ */
const path = require('path')
const fs = require('fs')
const { selectFakeFile, supportsChooseFile, ensureInputVisible } = require('../utils')

const testURL = 'http://localhost:4567/transloadit-assembly-options'

function setTransloaditKeyAndInit (transloaditKey) {
  window.initUppyTransloadit(transloaditKey)
}

describe('Transloadit getAssemblyOptions', () => {
  beforeEach(async () => {
    await browser.url(testURL)
  })

  it('should pass `fields` to `assembly:result`', async function test () {
    const transloaditKey = process.env.TRANSLOADIT_KEY
    if (transloaditKey === undefined) {
      console.log('skipping Transloadit integration test: process.env.TRANSLOADIT_KEY is not set')
      return this.skip()
    }

    const wrapper = await $('#uppy-transloadit')
    await wrapper.waitForExist()

    await browser.execute(setTransloaditKeyAndInit, transloaditKey)

    const input = await $('#uppy-transloadit .uppy-Dashboard-input')
    const result = await $('#uppy-result')

    await input.waitForExist()
    await browser.execute(ensureInputVisible, '#uppy-transloadit .uppy-Dashboard-input')

    if (supportsChooseFile(capabilities)) {
      await input.setValue(path.join(__dirname, '../../resources/image.jpg'))
    } else {
      const img = path.join(__dirname, '../../resources/image.jpg')
      await browser.execute(
        selectFakeFile,
        'uppyTransloadit',
        path.basename(img), // name
        'image/jpeg', // type
        fs.readFileSync(img, 'base64'), // b64
      )
    }
    await result.waitForExist({ timeout: 25000 })
    const text = await result.getText()
    expect(text).to.be.equal('ok')
  })
})
