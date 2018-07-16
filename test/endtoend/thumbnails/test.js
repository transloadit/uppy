/* global browser, expect, $ */
const path = require('path')
const fs = require('fs')
const { selectFakeFile, supportsChooseFile } = require('../utils')

const testURL = 'http://localhost:4567/thumbnails'

const images = [
  path.join(__dirname, '../../resources/image.jpg'),
  path.join(__dirname, '../../resources/baboon.png'),
  path.join(__dirname, '../../resources/kodim23.png')
]

describe.only('ThumbnailGenerator', () => {
  beforeEach(() => {
    browser.url(testURL)
  })

  it('should generate thumbnails for images', () => {
    $('#uppyThumbnails .uppy-FileInput-input').waitForExist()

    if (supportsChooseFile()) {
      for (const img of images) {
        browser.chooseFile('#uppyThumbnails .uppy-FileInput-input', img)
      }
    } else {
      for (const img of images) {
        browser.execute(
          selectFakeFile,
          'uppyThumbnails',
          path.basename(img), // name
          `image/${path.extname(img).slice(1)}`, // type
          fs.readFileSync(img, 'base64') // b64
        )
      }
    }

    browser.pause(20 * 1000)
  })
})
