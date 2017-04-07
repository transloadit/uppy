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
const Webcam = require('./plugins/Webcam/index.js')

// Progressindicators
const ProgressBar = require('./plugins/ProgressBar.js')
const Informer = require('./plugins/Informer.js')

// Modifiers
const MetaData = require('./plugins/MetaData.js')

// Uploaders
const Tus10 = require('./plugins/Tus10')
const Multipart = require('./plugins/Multipart')
const Transloadit = require('./plugins/Transloadit')

module.exports = {
  Core,
  Plugin,
  Dummy,
  ProgressBar,
  Informer,
  DragDrop,
  GoogleDrive,
  Dropbox,
  FileInput,
  Tus10,
  Multipart,
  Transloadit,
  Dashboard,
  MetaData,
  Webcam
}
