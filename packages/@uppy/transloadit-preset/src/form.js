const Uppy = require('@uppy/core')
const Form = require('@uppy/form')
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
    submitOnSuccess: true,
    addResultToForm: false // using custom implementation instead
  })

  uppy.use(AttachFileInputs, {
    target
  })

  return uppy
}

module.exports = form
