const Transloadit = require('@uppy/transloadit')

const transloaditOptionNames = [
  'service',
  'waitForEncoding',
  'waitForMetadata',
  'alwaysRunAssembly',
  'importFromUploadURLs',
  'signature',
  'params',
  'fields',
  'getAssemblyOptions'
]

function addTransloaditPlugin (uppy, opts) {
  const transloaditOptions = {}
  transloaditOptionNames.forEach((name) => {
    if (opts.hasOwnProperty(name)) transloaditOptions[name] = opts[name]
  })
  uppy.use(Transloadit, transloaditOptions)
}

module.exports = addTransloaditPlugin
