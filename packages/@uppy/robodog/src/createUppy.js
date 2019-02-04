const Uppy = require('@uppy/core')

const eventNames = {
  onFileAdded: 'file-added',
  onFileRemoved: 'file-removed',

  onAssemblyCreated: 'transloadit:assembly-created',
  onAssemblyExecuting: 'transloadit:assembly-executing',
  onAssemblyComplete: 'transloadit:complete',

  onStart: 'upload',
  onPause: 'pause-all',
  onFilePause: 'upload-pause',
  onCancel: 'cancel-all',
  onFileCancel: 'upload-cancel',
  onFileProgress: 'upload-progress',
  onUploaded: 'transloadit:upload',
  onResult: 'transloadit:result',
  onComplete: 'complete'
}

const uppyOptionNames = [
  'autoProceed',
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

  const uppy = Uppy(uppyOptions)

  // Builtin event aliases
  Object.keys(eventNames).forEach((optionName) => {
    const eventName = eventNames[optionName]
    if (typeof opts[optionName] === 'function') {
      uppy.on(eventName, opts[optionName])
    }
  })

  // Custom events (these should probably be added to core)
  if (typeof opts.onProgress === 'function') {
    uppy.on('upload-progress', () => {
      const { totalProgress } = uppy.getState()
      opts.onProgress.call(uppy, totalProgress)
    })
  }

  return uppy
}

module.exports = createUppy
