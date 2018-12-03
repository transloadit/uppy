const Uppy = require('@uppy/core')
const Form = require('@uppy/form')
const StatusBar = require('@uppy/status-bar')
const AttachFileInputs = require('./AttachFileInputs')
const TransloaditFormResult = require('./TransloaditFormResult')
const addTransloaditPlugin = require('./addTransloaditPlugin')

function form (target, opts) {
  const uppy = Uppy({
    allowMultipleUploads: false,
    restrictions: opts.restrictions
  })
  addTransloaditPlugin(uppy, opts)

  uppy.use(TransloaditFormResult, {
    target,
    transloaditPluginId: 'Transloadit',
    name: 'transloadit'
  })

  uppy.use(Form, {
    target,
    triggerUploadOnSubmit: true,
    submitOnSuccess: true,
    addResultToForm: false // using custom implementation instead
  })

  uppy.use(AttachFileInputs, {
    target
  })

  if (opts.progressBar) {
    uppy.use(StatusBar, {
      target: opts.progressBar,
      // hide most of the things to keep our api simple,
      // we can change this in the future if someone needs it
      hideUploadButton: true,
      hideAfterFinish: true,
      hideRetryButton: true,
      hidePauseResumeButtons: true,
      hideCancelButtons: true
    })
  }

  return uppy
}

module.exports = form
