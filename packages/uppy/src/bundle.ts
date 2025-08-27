// Core
// Plugin base classes
export { BasePlugin, debugLogger, default as Uppy, UIPlugin } from '@uppy/core'

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

// Acquirers
export { default as Audio } from '@uppy/audio'
// Uploaders
export { default as AwsS3 } from '@uppy/aws-s3'
export { default as Box } from '@uppy/box'
// Miscellaneous
export { default as Compressor } from '@uppy/compressor'
// UI plugins
export { default as Dashboard } from '@uppy/dashboard'
export { default as DragDrop } from '@uppy/drag-drop'
export { default as DropTarget } from '@uppy/drop-target'
export { default as Dropbox } from '@uppy/dropbox'
export { default as Facebook } from '@uppy/facebook'
export { default as Form } from '@uppy/form'
export { default as GoldenRetriever } from '@uppy/golden-retriever'
export { default as GoogleDrive } from '@uppy/google-drive'
export { default as GoogleDrivePicker } from '@uppy/google-drive-picker'
export { default as GooglePhotosPicker } from '@uppy/google-photos-picker'
export { default as ImageEditor } from '@uppy/image-editor'
export { default as Instagram } from '@uppy/instagram'
export { default as OneDrive } from '@uppy/onedrive'
export { default as RemoteSources } from '@uppy/remote-sources'
export { default as ScreenCapture } from '@uppy/screen-capture'
export { default as StatusBar } from '@uppy/status-bar'
// Stores
export { default as DefaultStore } from '@uppy/store-default'
export { default as ThumbnailGenerator } from '@uppy/thumbnail-generator'
export { default as Transloadit } from '@uppy/transloadit'
export { default as Tus } from '@uppy/tus'
export { default as Unsplash } from '@uppy/unsplash'
export { default as Url } from '@uppy/url'
export { default as Webcam } from '@uppy/webcam'
export { default as XHRUpload } from '@uppy/xhr-upload'
export { default as Zoom } from '@uppy/zoom'

// Special hack for Transloadit static exports
import Transloadit, {
  COMPANION_ALLOWED_HOSTS,
  COMPANION_URL,
} from '@uppy/transloadit'

// @ts-expect-error monkey patching
Transloadit.COMPANION_URL = COMPANION_URL
// @ts-expect-error monkey patching
Transloadit.COMPANION_ALLOWED_HOSTS = COMPANION_ALLOWED_HOSTS

export const locales = {}
