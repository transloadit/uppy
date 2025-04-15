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

export type Render = (root: Element | null, node: any, id?: string) => void
// Since we do depedency injection, the type is different for each framework
// so we can't type it strictly
export type Component = any
