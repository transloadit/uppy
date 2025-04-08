import type Uppy from '@uppy/core'

export type UploadStatus =
  | 'init'
  | 'ready'
  | 'uploading'
  | 'paused'
  | 'error'
  | 'complete'

export interface UppyContextValue {
  uppy: Uppy | undefined
  status: UploadStatus
  progress: number
}
