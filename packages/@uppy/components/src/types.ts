import type Uppy from '@uppy/core'
import type { UploadStatus } from '@uppy/core'

export type UppyContext = {
  uppy: Uppy | undefined
  status: UploadStatus
  progress: number
}
