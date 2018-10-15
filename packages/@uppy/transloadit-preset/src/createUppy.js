const Uppy = require('@uppy/core')

const uppyOptionNames = [
  'restrictions',
  'meta',
  'onBeforeFileAdded',
  'onBeforeUpload'
]
function createUppy (opts, overrides = {}) {
  const uppyOptions = {}
  uppyOptionNames.forEach((name) => {
    if (opts.hasOwnProperty(name)) uppyOptions[name] = opts[name]
  })
  Object.assign(uppyOptions, overrides)

  return Uppy(uppyOptions)
}

module.exports = createUppy
