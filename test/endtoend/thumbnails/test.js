/* global browser, expect, $, $$ */
const path = require('path')
const fs = require('fs')
const { selectFakeFile, supportsChooseFile } = require('../utils')

const testURL = 'http://localhost:4567/thumbnails'

const images = [
  path.join(__dirname, '../../resources/image.jpg'),
  path.join(__dirname, '../../resources/baboon.png'),
  path.join(__dirname, '../../resources/kodim23.png'),
  path.join(__dirname, '../../resources/invalid.png')
]
const notImages = [
  { type: 'text/javascript', file: __filename }
]

describe('ThumbnailGenerator', () => {
  beforeEach(() => {
    browser.url(testURL)
  })

  it('should generate thumbnails for images', function () {
    // FIXME why isn't the selectFakeFile alternative below working?
    if (!supportsChooseFile()) {
      return this.skip()
    }

    $('#uppyThumbnails .uppy-FileInput-input').waitForExist()

    browser.execute(/* must be valid ES5 for IE */ function () {
      window.thumbnailsReady = new Promise(function (resolve) {
        window.uppyThumbnails.on('thumbnail:all-generated', resolve)
      })
    })

    if (supportsChooseFile()) {
      for (const img of images) {
        browser.chooseFile('#uppyThumbnails .uppy-FileInput-input', img)
      }
      for (const { file } of notImages) {
        browser.chooseFile('#uppyThumbnails .uppy-FileInput-input', file)
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
      for (const { type, file } of notImages) {
        browser.execute(
          selectFakeFile,
          'uppyThumbnails',
          path.basename(file), // name
          type, // type
          fs.readFileSync(file, 'base64') // b64
        )
      }
    }

    browser.executeAsync(/* must be valid ES5 for IE */ function (done) {
      window.thumbnailsReady.then(done)
    })

    // const names = $$('p.file-name')
    const previews = $$('img.file-preview')

    // Names should all be listed before previews--indicates that previews were generated asynchronously.
    /* Nevermind this, chooseFile() doesn't accept multiple files so they are added one by one and the thumbnails
     * have finished generating by the time we add the next.
    const nys = names.map((el) => el.getLocation('y'))
    const pys = previews.map((el) => el.getLocation('y'))
    for (const ny of nys) {
      for (const py of pys) {
        expect(ny).to.be.below(py, 'names should be listed before previews')
      }
    }
    */

    expect(previews).to.have.lengthOf(3) // ex. the invalid image
    for (const p of previews) {
      expect(p.getAttribute('src')).to.match(/^blob:/)
      expect(p.getElementSize('width')).to.equal(200)
    }
  })
})
