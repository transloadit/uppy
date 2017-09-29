const Uppy = require('uppy/lib/core/Core')
const FileInput = require('uppy/lib/plugins/FileInput')
const XHRUpload = require('uppy/lib/plugins/XHRUpload')
const ProgressBar = require('uppy/lib/plugins/ProgressBar')

const uppy = new Uppy({debug: true, autoProceed: true})

uppy
  .use(FileInput)
  .use(XHRUpload, {
    endpoint: '//api2.transloadit.com',
    formData: true,
    fieldName: 'files[]'
  })
  // by default Uppy removes everything inside target container,
  // but we surely don’t want to do that in the case of body, so replaceTargetContent: false
  .use(ProgressBar, {
    target: 'body',
    replaceTargetContent: false,
    fixed: true
  })
  .run()

console.log('Uppy with Formtag and XHRUpload is loaded')
