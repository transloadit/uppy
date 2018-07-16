require('es6-promise/auto')
require('whatwg-fetch')
const Uppy = require('@uppy/core')
const ThumbnailGenerator = require('@uppy/thumbnail-generator')
const FileInput = require('@uppy/file-input')

const uppyThumbnails = Uppy({
  id: 'uppyThumbnails',
  autoProceed: false,
  debug: true
})

uppyThumbnails.use(ThumbnailGenerator, {})
uppyThumbnails.use(FileInput, { target: '#uppyThumbnails', pretty: false })

uppyThumbnails.on('thumbnail:generated', (file) => {
  const img = new Image()
  img.src = file.preview

  document.body.appendChild(img)
})
window.ready = new Promise((resolve) => uppyThumbnails.on('thumbnail:ready', resolve))
