// Core
exports.Core = require('@uppy/core')

exports.debugLogger = exports.Core.debugLogger

// Utilities
exports.server = require('@uppy/companion-client')

exports.views = {
  // eslint-disable-next-line global-require
  ProviderView: require('@uppy/provider-views'),
}

// Stores
exports.DefaultStore = require('@uppy/store-default')
exports.ReduxStore = require('@uppy/store-redux')

// UI plugins
exports.Dashboard = require('@uppy/dashboard')
exports.DragDrop = require('@uppy/drag-drop')
exports.DropTarget = require('@uppy/drop-target')
exports.FileInput = require('@uppy/file-input')
exports.ImageEditor = require('@uppy/image-editor')
exports.Informer = require('@uppy/informer')
exports.ProgressBar = require('@uppy/progress-bar')
exports.StatusBar = require('@uppy/status-bar')

// Acquirers
exports.Audio = require('@uppy/audio')
exports.Box = require('@uppy/box')
exports.Dropbox = require('@uppy/dropbox')
exports.Facebook = require('@uppy/facebook')
exports.GoogleDrive = require('@uppy/google-drive')
exports.Instagram = require('@uppy/instagram')
exports.OneDrive = require('@uppy/onedrive')
exports.RemoteSources = require('@uppy/remote-sources')
exports.ScreenCapture = require('@uppy/screen-capture')
exports.Unsplash = require('@uppy/unsplash')
exports.Url = require('@uppy/url')
exports.Webcam = require('@uppy/webcam')
exports.Zoom = require('@uppy/zoom')

// Uploaders
exports.AwsS3 = require('@uppy/aws-s3')
exports.AwsS3Multipart = require('@uppy/aws-s3-multipart')
exports.Transloadit = require('@uppy/transloadit')
exports.Tus = require('@uppy/tus')
exports.XHRUpload = require('@uppy/xhr-upload')

// Miscellaneous
exports.Compressor = require('@uppy/compressor')
exports.Form = require('@uppy/form')
exports.GoldenRetriever = require('@uppy/golden-retriever')
exports.ReduxDevTools = require('@uppy/redux-dev-tools')
exports.ThumbnailGenerator = require('@uppy/thumbnail-generator')

exports.locales = {}
