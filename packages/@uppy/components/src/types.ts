import type Uppy from '@uppy/core'

export type UploadStatus =
  | 'init'
  | 'ready'
  | 'uploading'
  | 'paused'
  | 'error'
  | 'complete'

export type UppyState = {
  status: UploadStatus
  progress: number
}

export type UppyContext = UppyState & {
  uppy: Uppy | undefined
}

export type NonNullableUppyContext = UppyContext & {
  uppy: Uppy
}
