// Core
export { default as Core } from '@uppy/core'

// Utilities
export { default as server } from '@uppy/server-utils'
import ProviderView from '@uppy/provider-views'
export var views = { ProviderView: ProviderView }

// Stores
export { default as DefaultStore } from '@uppy/store-default'
export { default as ReduxStore } from '@uppy/store-redux'

// UI plugins
export { default as Dashboard } from '@uppy/dashboard'
export { default as DragDrop } from '@uppy/drag-drop'
export { default as FileInput } from '@uppy/file-input'
export { default as Informer } from '@uppy/informer'
export { default as ProgressBar } from '@uppy/progress-bar'
export { default as StatusBar } from '@uppy/statusbar'

// Acquirers
export { default as Dropbox } from '@uppy/dropbox'
export { default as GoogleDrive } from '@uppy/google-drive'
export { default as Instagram } from '@uppy/instagram'
export { default as Url } from '@uppy/url'
export { default as Webcam } from '@uppy/webcam'

// Uploaders
export { default as AwsS3 } from '@uppy/aws-s3'
export { default as AwsS3Multipart } from '@uppy/aws-s3-multipart'
export { default as Transloadit } from '@uppy/transloadit'
export { default as Tus } from '@uppy/tus'
export { default as XHRUpload } from '@uppy/xhrupload'

// Miscellaneous
export { default as Form } from '@uppy/form'
export { default as GoldenRetriever } from '@uppy/golden-retriever'
export { default as ReduxDevTools } from '@uppy/redux-dev-tools'
export { default as ThumbnailGenerator } from '@uppy/thumbnail-generator'
