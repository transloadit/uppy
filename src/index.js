const Core = require('@uppy/core')

// Communication with Uppy Server
const server = require('@uppy/server-utils')

// Reusable views
const ProviderView = require('@uppy/provider-views')

// Parent
const Plugin = require('@uppy/core/lib/Plugin')

// Acquirers
const Dashboard = require('@uppy/dashboard')
const DragDrop = require('@uppy/drag-drop')
const FileInput = require('@uppy/file-input')
const GoogleDrive = require('@uppy/google-drive')
const Dropbox = require('@uppy/dropbox')
const Instagram = require('@uppy/instagram')
const Url = require('./plugins/Url')
const Webcam = require('@uppy/webcam')

// Progressindicators
const StatusBar = require('@uppy/statusbar')
const ProgressBar = require('@uppy/progress-bar')
const Informer = require('@uppy/informer')

// Uploaders
const Tus = require('@uppy/tus')
const XHRUpload = require('@uppy/aws-s3')
const Transloadit = require('@uppy/transloadit')
const AwsS3 = require('@uppy/aws-s3')

// Helpers and utilities
const Form = require('@uppy/form')
const ThumbnailGenerator = require('@uppy/thumbnail-generator')
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
