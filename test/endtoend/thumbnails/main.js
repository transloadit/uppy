/* eslint-disable */
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

uppyThumbnails.on('file-added', (file) => {
  const el = document.createElement('p')
  el.className = 'file-name'
  el.textContent = file.name
  document.body.appendChild(el)
})

// Dump errors to the screen so saucelabs shows them in screenshots.
uppyThumbnails.on('thumbnail:error', (file, err) => {
  const el = document.createElement('pre')
  el.style = 'font: 14pt monospace; background: red; color: white'
  el.textContent = `Error: ${err.stack}`
  document.body.appendChild(el)
})

uppyThumbnails.on('thumbnail:generated', (file, preview) => {
  const img = new Image()
  img.src = file.preview
  img.className = 'file-preview'
  img.style.display = 'block'

  document.body.appendChild(img)
})
