const Uppy = require('uppy/lib/core/Core')
const FileInput = require('uppy/lib/plugins/FileInput')
const StatusBar = require('uppy/lib/plugins/StatusBar')
const Tus = require('uppy/lib/plugins/Tus')

const uppyOne = new Uppy({debug: true})
uppyOne
  .use(FileInput, { target: '.UppyInput', pretty: false })
  .use(Tus, { endpoint: '//master.tus.io/files/' })
  .use(StatusBar, { target: '.UppyInput-Progress', hideUploadButton: true })
