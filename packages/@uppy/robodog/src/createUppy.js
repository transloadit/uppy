const Uppy = require('@uppy/core')
const has = require('@uppy/utils/lib/hasProperty')

const eventNames = {
  // File management events
  onFileAdded: 'file-added',
  onFileRemoved: 'file-removed',

  // Transloadit events
  onImportError: 'transloadit:import-error',
  onAssemblyCreated: 'transloadit:assembly-created',
  onAssemblyExecuting: 'transloadit:assembly-executing',
  onAssemblyError: 'transloadit:assembly-error',
  onAssemblyComplete: 'transloadit:complete',
  onResult: 'transloadit:result',

  // Upload events
  onStart: 'upload',
  onPause: 'pause-all',
  onFilePause: 'upload-pause',
  onCancel: 'cancel-all',
  onError: 'error', // mostly akin to promise rejection
  onFileCancel: 'upload-cancel',
  onFileProgress: 'upload-progress',
  onFileError: 'upload-error',
  onUploaded: 'transloadit:upload',
  onComplete: 'complete' // mostly akin to promise resolution
}

const uppyOptionNames = [
  'autoProceed',
  'restrictions',
  'meta',
  'onBeforeFileAdded',
  'onBeforeUpload',
  'debug'
]
function createUppy (opts, overrides = {}) {
  const uppyOptions = {}
  uppyOptionNames.forEach((name) => {
    if (has(opts, name)) uppyOptions[name] = opts[name]
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
