const Core = require('@uppy/core')

// Communication with Uppy Server
const server = require('@uppy/server-utils')

// Reusable views
const ProviderView = require('@uppy/provider-views')

// Parent
const Plugin = require('@uppy/core/lib/Plugin')

// Acquirers
const Dashboard = require('./plugins/Dashboard')
const DragDrop = require('@uppy/drag-drop')
const FileInput = require('./plugins/FileInput')
const GoogleDrive = require('./plugins/GoogleDrive')
const Dropbox = require('./plugins/Dropbox')
const Instagram = require('./plugins/Instagram')
const Url = require('./plugins/Url')
const Webcam = require('./plugins/Webcam')

// Progressindicators
const StatusBar = require('@uppy/statusbar')
const ProgressBar = require('./plugins/ProgressBar')
const Informer = require('@uppy/informer')

// Uploaders
const Tus = require('@uppy/tus')
const XHRUpload = require('./plugins/XHRUpload')
const Transloadit = require('./plugins/Transloadit')
const AwsS3 = require('./plugins/AwsS3')

// Helpers and utilities
const Form = require('./plugins/Form')
const ThumbnailGenerator = require('./plugins/ThumbnailGenerator')
const GoldenRetriever = require('./plugins/GoldenRetriever')
const ReduxDevTools = require('./plugins/ReduxDevTools')

module.exports = {
  Core,
  views: { ProviderView },
  server,
  Plugin,
  StatusBar,
  ProgressBar,
  Informer,
  DragDrop,
  GoogleDrive,
  Dropbox,
  Instagram,
  Url,
  FileInput,
  Tus,
  XHRUpload,
  Transloadit,
  AwsS3,
  Dashboard,
  Webcam,
  Form,
  ThumbnailGenerator,
  GoldenRetriever,
  ReduxDevTools
}
