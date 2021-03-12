const Transloadit = require('@uppy/transloadit')
const has = require('@uppy/utils/lib/hasProperty')
const TransloaditResults = require('./TransloaditResultsPlugin')

const transloaditOptionNames = [
  'service',
  'waitForEncoding',
  'waitForMetadata',
  'alwaysRunAssembly',
  'importFromUploadURLs',
  'signature',
  'params',
  'fields',
  'limit',
  'locale',
  'getAssemblyOptions'
]

function addTransloaditPlugin (uppy, opts) {
  const transloaditOptions = {}
  transloaditOptionNames.forEach((name) => {
    if (has(opts, name)) transloaditOptions[name] = opts[name]
  })
  uppy.use(Transloadit, transloaditOptions)

  // Adds a `results` key to the upload result data containing a flat array of all results from all Assemblies.
  if (transloaditOptions.waitForEncoding) {
    uppy.use(TransloaditResults)
  }
}

module.exports = addTransloaditPlugin
