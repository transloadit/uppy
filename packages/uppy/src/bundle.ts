/* eslint-disable import/first */
// Core
export { default as Uppy, debugLogger } from '@uppy/core'

// Plugin base classes
export { default as UIPlugin } from '@uppy/core/lib/UIPlugin.js'
export { default as BasePlugin } from '@uppy/core'

/**
 * @deprecated Use `Uppy` instead of `Core`
 */
export function Core() {
  throw new Error('Core has been renamed to Uppy')
}

// Utilities
export * as server from '@uppy/companion-client'

import * as ProviderView from '@uppy/provider-views'

export const views = { ProviderView }

// Stores
export { default as DefaultStore } from '@uppy/store-default'
// not yet typed
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export { default as ReduxStore } from '@uppy/store-redux'

// UI plugins
export { default as Dashboard } from '@uppy/dashboard'
export { default as DragDrop } from '@uppy/drag-drop'
export { default as DropTarget } from '@uppy/drop-target'
export { default as FileInput } from '@uppy/file-input'
export { default as ImageEditor } from '@uppy/image-editor'
export { default as Informer } from '@uppy/informer'
export { default as ProgressBar } from '@uppy/progress-bar'
export { default as StatusBar } from '@uppy/status-bar'

// Acquirers
export { default as Audio } from '@uppy/audio'
export { default as Box } from '@uppy/box'
export { default as Dropbox } from '@uppy/dropbox'
export { default as Facebook } from '@uppy/facebook'
export { default as GoogleDrive } from '@uppy/google-drive'
export { default as GooglePhotos } from '@uppy/google-photos'
export { default as GoogleDrivePicker } from '@uppy/google-drive-picker'
export { default as GooglePhotosPicker } from '@uppy/google-photos-picker'
export { default as Instagram } from '@uppy/instagram'
export { default as OneDrive } from '@uppy/onedrive'
export { default as RemoteSources } from '@uppy/remote-sources'
export { default as ScreenCapture } from '@uppy/screen-capture'
export { default as Unsplash } from '@uppy/unsplash'
export { default as Url } from '@uppy/url'
export { default as Webcam } from '@uppy/webcam'
export { default as Zoom } from '@uppy/zoom'

// Uploaders
export { default as AwsS3 } from '@uppy/aws-s3'
export { default as Transloadit } from '@uppy/transloadit'
export { default as Tus } from '@uppy/tus'
export { default as XHRUpload } from '@uppy/xhr-upload'

// Miscellaneous
export { default as Compressor } from '@uppy/compressor'
export { default as Form } from '@uppy/form'
export { default as GoldenRetriever } from '@uppy/golden-retriever'
// not yet typed
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export { default as ReduxDevTools } from '@uppy/redux-dev-tools'
export { default as ThumbnailGenerator } from '@uppy/thumbnail-generator'

// Special hack for Transloadit static exports
import Transloadit, {
  COMPANION_URL,
  COMPANION_ALLOWED_HOSTS,
} from '@uppy/transloadit'

// @ts-expect-error monkey patching
Transloadit.COMPANION_URL = COMPANION_URL
// @ts-expect-error monkey patching
Transloadit.COMPANION_ALLOWED_HOSTS = COMPANION_ALLOWED_HOSTS

export const locales = {}
