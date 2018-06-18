// Core
exports.Core = require('@uppy/core')

// Utilities
exports.server = require('@uppy/server-utils')
exports.views = {
  ProviderView: require('@uppy/provider-views')
}

// Stores
exports.DefaultStore = require('@uppy/store-default')
exports.ReduxStore = require('@uppy/store-redux')

// UI plugins
exports.Dashboard = require('@uppy/dashboard')
exports.DragDrop = require('@uppy/drag-drop')
exports.FileInput = require('@uppy/file-input')
exports.Informer = require('@uppy/informer')
exports.ProgressBar = require('@uppy/progress-bar')
exports.StatusBar = require('@uppy/statusbar')

// Acquirers
exports.Dropbox = require('@uppy/dropbox')
exports.GoogleDrive = require('@uppy/google-drive')
exports.Instagram = require('@uppy/instagram')
exports.Url = require('@uppy/url')
exports.Webcam = require('@uppy/webcam')

// Uploaders
exports.AwsS3 = require('@uppy/aws-s3')
exports.Transloadit = require('@uppy/transloadit')
exports.Tus = require('@uppy/tus')
exports.XHRUpload = require('@uppy/xhrupload')

// Miscellaneous
exports.Form = require('@uppy/form')
exports.GoldenRetriever = require('@uppy/golden-retriever')
exports.ReduxDevTools = require('@uppy/redux-dev-tools')
exports.ThumbnailGenerator = require('@uppy/thumbnail-generator')
