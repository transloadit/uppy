import type Uppy from '@uppy/core'

export type UploadStatus =
  | 'init'
  | 'ready'
  | 'uploading'
  | 'paused'
  | 'error'
  | 'complete'

export type UppyContext = {
  uppy: Uppy | undefined
  status: UploadStatus
  progress: number
}
