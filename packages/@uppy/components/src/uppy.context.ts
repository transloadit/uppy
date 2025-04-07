import type Uppy from '@uppy/core'
import { createContext } from 'preact'

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

export default createContext<UppyContext>({
  uppy: undefined,
  status: 'init',
  progress: 0,
})
