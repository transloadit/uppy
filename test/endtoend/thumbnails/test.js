/* global browser, capabilities, expect, $, $$ */
const path = require('path')
const fs = require('fs')
const { selectFakeFile, supportsChooseFile } = require('../utils')

const testURL = 'http://localhost:4567/thumbnails'

const images = [
  path.join(__dirname, '../../resources/image.jpg'),
  path.join(__dirname, '../../resources/baboon.png'),
  path.join(__dirname, '../../resources/kodim23.png'),
  path.join(__dirname, '../../resources/invalid.png'),
]
const notImages = [
  { type: 'text/javascript', file: __filename },
]

describe('ThumbnailGenerator', () => {
  beforeEach(async () => {
    await browser.url(testURL)
  })

  it('should generate thumbnails for images', async function test () {
    // Does not work on IE right now
    if (capabilities.browserName === 'internet explorer') {
      this.skip()
      return
    }

    const input = await $('#uppyThumbnails .uppy-FileInput-input')
    await input.waitForExist()

    await browser.execute(/* must be valid ES5 for IE */ () => {
      window.thumbnailsReady = new Promise((resolve) => {
        window.uppyThumbnails.on('thumbnail:all-generated', resolve)
      })
    })

    if (supportsChooseFile()) {
      for (const file of images) {
        await input.setValue(file)
      }
      for (const { file } of notImages) {
        await input.setValue(file)
      }
    } else {
      for (const img of images) {
        await browser.execute(
          selectFakeFile,
          'uppyThumbnails',
          path.basename(img), // name
          `image/${path.extname(img).slice(1)}`, // type
          fs.readFileSync(img, 'base64') // b64
        )
      }
      for (const { type, file } of notImages) {
        await browser.execute(
          selectFakeFile,
          'uppyThumbnails',
          path.basename(file), // name
          type, // type
          fs.readFileSync(file, 'base64') // b64
        )
      }
    }

    await browser.executeAsync(/* must be valid ES5 for IE */ (done) => {
      window.thumbnailsReady.then(done)
    })

    // const names = $$('p.file-name')
    const previews = await $$('img.file-preview')

    // Names should all be listed before previews--indicates that previews were generated asynchronously.
    /* Nevermind this, setValue() doesn't accept multiple files so they are added one by one and the thumbnails
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
      expect(await p.getAttribute('src')).to.match(/^blob:/)
      expect(await getWidth(p)).to.equal(200)
    }
  })
})

async function getWidth (ref) {
  try {
    return await ref.getSize('width')
  } catch (err) {
    return browser.execute((el) => {
      return el.getBoundingClientRect().width
    }, ref)
  }
}
