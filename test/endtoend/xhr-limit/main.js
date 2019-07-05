require('es6-promise/auto')
require('whatwg-fetch')

const Uppy = require('@uppy/core')
const FileInput = require('@uppy/file-input')
const XHRUpload = require('@uppy/xhr-upload')

function startXHRLimitTest (endpoint) {
  const uppy = Uppy({
    id: 'uppyXhrLimit',
    debug: true,
    autoProceed: false
  })
    .use(FileInput, { target: '#uppyXhrLimit', pretty: false })
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
