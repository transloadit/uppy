const Uppy = require('uppy/lib/core/Core')
const FileInput = require('uppy/lib/plugins/FileInput')
const Multipart = require('uppy/lib/plugins/Multipart')
const ProgressBar = require('uppy/lib/plugins/ProgressBar')

const uppy = new Uppy({debug: true, autoProceed: true})

uppy
  .use(FileInput)
  .use(Multipart, {
    endpoint: '//api2.transloadit.com',
    bundle: true,
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

console.log('Uppy with Formtag and Multipart is loaded')
