import throttle from 'lodash/throttle.js'
import type { UppyFile } from './UppyFile'
import type { FileProgress } from './FileProgress'

function emitSocketProgress(
  uploader: any,
  progressData: FileProgress,
  file: UppyFile,
): void {
  const { progress, bytesUploaded, bytesTotal } = progressData
  if (progress) {
    uploader.uppy.log(`Upload progress: ${progress}`)
    uploader.uppy.emit('upload-progress', file, {
      uploader,
      bytesUploaded,
      bytesTotal,
    })
  }
}

export default throttle(emitSocketProgress, 300, {
  leading: true,
  trailing: true,
})
