// Headless components
export { default as Thumbnail, type ThumbnailProps } from './Thumbnail.js'
export { default as FilesList, type FilesListProps } from './FilesList.js'
export { default as FilesGrid, type FilesGridProps } from './FilesGrid.js'
export { default as Dropzone, type DropzoneProps } from './Dropzone.js'
export {
  default as UploadButton,
  type UploadButtonProps,
} from './UploadButton.js'
export {
  default as ProviderIcon,
  type ProviderIconProps,
} from './ProviderIcon.js'

// Headless hooks
export {
  createDropzone,
  type DropzoneReturn,
  type DropzoneOptions,
} from './hooks/dropzone.js'
export {
  createFileInput,
  type FileInputProps,
  type FileInputFunctions,
} from './hooks/file-input.js'
export {
  createWebcamController,
  type WebcamStore,
  type WebcamStatus,
  type WebcamSnapshot,
} from './hooks/webcam.js'
export {
  createRemoteSourceController,
  type RemoteSourceStore,
  type RemoteSourceSnapshot,
  type RemoteSourceKeys,
} from './hooks/remote-source.js'

export {
  createScreenCaptureController,
  type ScreenCaptureStore,
  type ScreenCaptureSnapshot,
} from './hooks/screencapture.js'

// Types and utils
export type {
  UppyContext,
  UppyState,
  UploadStatus,
  NonNullableUppyContext,
} from './types.js'
export { createUppyEventAdapter } from './uppyEventAdapter.js'
