const Uppy = require('@uppy/core')
const FileInput = require('@uppy/file-input')
const XHRUpload = require('@uppy/xhrupload')
const ProgressBar = require('@uppy/progress-bar')

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
