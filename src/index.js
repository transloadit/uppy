const Core = require('./core')

// Parent
const Plugin = require('./core/Plugin')

// Orchestrators
const Dashboard = require('./plugins/Dashboard')

// Acquirers
const Dummy = require('./plugins/Dummy')
const DragDrop = require('./plugins/DragDrop')
const FileInput = require('./plugins/FileInput')
const GoogleDrive = require('./plugins/GoogleDrive')
const Dropbox = require('./plugins/Dropbox')
const Instagram = require('./plugins/Instagram')
const Webcam = require('./plugins/Webcam')

// Progressindicators
const StatusBar = require('./plugins/StatusBar')
const ProgressBar = require('./plugins/ProgressBar')
const Informer = require('./plugins/Informer')

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
