import throttle from 'lodash/throttle.js'
import type { Uppy } from '@uppy/core'
import type { UppyFile } from './UppyFile.ts'

function emitSocketProgress(
  uploader: { uppy: Uppy<any, any> },
  progressData: {
    progress: string // pre-formatted percentage
    bytesTotal: number
    bytesUploaded: number
  },
  file: UppyFile<any, any>,
): void {
  const { progress, bytesUploaded, bytesTotal } = progressData
  if (progress) {
    uploader.uppy.log(`Upload progress: ${progress}`)
    uploader.uppy.emit('upload-progress', file, {
      uploadStarted: file.progress.uploadStarted ?? 0,
      bytesUploaded,
      bytesTotal,
    })
  }
}

export default throttle(emitSocketProgress, 300, {
  leading: true,
  trailing: true,
})
