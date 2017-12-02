const Core = require('./core/index.js')

// Parent
const Plugin = require('./plugins/Plugin')

// Orchestrators
const Dashboard = require('./plugins/Dashboard/index.js')

// Acquirers
const Dummy = require('./plugins/Dummy')
const DragDrop = require('./plugins/DragDrop/index.js')
const FileInput = require('./plugins/FileInput.js')
const GoogleDrive = require('./plugins/GoogleDrive/index.js')
const Dropbox = require('./plugins/Dropbox/index.js')
const Instagram = require('./plugins/Instagram/index.js')
const Webcam = require('./plugins/Webcam/index.js')

// Progressindicators
const StatusBar = require('./plugins/StatusBar')
const ProgressBar = require('./plugins/ProgressBar.js')
const Informer = require('./plugins/Informer.js')

// Modifiers

// Uploaders
const Tus = require('./plugins/Tus')
const XHRUpload = require('./plugins/XHRUpload')
const Transloadit = require('./plugins/Transloadit')
const AwsS3 = require('./plugins/AwsS3')

// Helpers and utilities
const GoldenRetriever = require('./plugins/GoldenRetriever')
const ReduxDevTools = require('./plugins/ReduxDevTools')
const ReduxStore = require('./plugins/Redux')

module.exports = {
  Core,
  Plugin,
  Dummy,
  StatusBar,
  ProgressBar,
  Informer,
  DragDrop,
  GoogleDrive,
  Dropbox,
  Instagram,
  FileInput,
  Tus,
  XHRUpload,
  Transloadit,
  AwsS3,
  Dashboard,
  Webcam,
  GoldenRetriever,
  ReduxDevTools,
  ReduxStore
}

Object.defineProperty(module.exports, 'RestoreFiles', {
  enumerable: true,
  configurable: true,
  get: () => {
    console.warn('Uppy.RestoreFiles is deprecated and will be removed in v0.22. Use Uppy.GoldenRetriever instead.')
    Object.defineProperty(module.exports, 'RestoreFiles', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: GoldenRetriever
    })
    return GoldenRetriever
  }
})

Object.defineProperty(module.exports, 'Tus10', {
  enumerable: true,
  configurable: true,
  get: () => {
    console.warn('Uppy.Tus10 is deprecated and will be removed in v0.22. Use Uppy.Tus instead.')
    Object.defineProperty(module.exports, 'Tus10', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: Tus
    })
    return Tus
  }
})
