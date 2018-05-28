const Uppy = require('uppy/lib/core/Core')
const FileInput = require('uppy/lib/plugins/FileInput')
const XHRUpload = require('uppy/lib/plugins/XHRUpload')
const ProgressBar = require('uppy/lib/plugins/ProgressBar')

const uppy = new Uppy({ debug: true, autoProceed: true })
uppy.use(FileInput, { target: '.UppyForm', replaceTargetContent: true })
uppy.use(XHRUpload, {
  endpoint: '//api2.transloadit.com',
  formData: true,
  fieldName: 'files[]'
})
uppy.use(ProgressBar, {
  target: 'body',
  fixed: true,
  hideAfterFinish: false
})

console.log('Uppy with Formtag and XHRUpload is loaded')
