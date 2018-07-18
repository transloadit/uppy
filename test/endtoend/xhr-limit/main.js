require('es6-promise/auto')
require('whatwg-fetch')

const Uppy = require('@uppy/core')
const DragDrop = require('@uppy/drag-drop')
const XHRUpload = require('@uppy/xhr-upload')

function startXHRLimitTest (endpoint) {
  const uppy = Uppy({
    id: 'uppyXhrLimit',
    debug: true,
    autoProceed: false
  })
    .use(DragDrop, { target: '#uppyXhrLimit' })
    .use(XHRUpload, { endpoint, limit: 2 })

  uppy.uploadsStarted = 0
  uppy.uploadsComplete = 0

  uppy.on('upload-started', () => {
    uppy.uploadsStarted++
  })
  uppy.on('upload-success', () => {
    uppy.uploadsComplete++
  })
}

window.startXHRLimitTest = startXHRLimitTest
