const Uppy = require('@uppy/core')
const FileInput = require('@uppy/file-input')
const StatusBar = require('@uppy/status-bar')
const Tus = require('@uppy/tus')

const uppyOne = new Uppy({debug: true})
uppyOne
  .use(FileInput, { target: '.UppyInput', pretty: false })
  .use(Tus, { endpoint: '//master.tus.io/files/' })
  .use(StatusBar, { target: '.UppyInput-Progress', hideUploadButton: true })
