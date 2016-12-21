const Uppy = require('../../../../src/core/Core.js')
const FileInput = require('../../../../src/plugins/FileInput.js')
const Multipart = require('../../../../src/plugins/Multipart.js')
const ProgressBar = require('../../../../src/plugins/ProgressBar.js')

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
