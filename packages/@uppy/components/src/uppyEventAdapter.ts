import Uppy from '@uppy/core'
import type { UploadStatus } from './types'

export function createUppyEventAdapter({
  uppy,
  onStatusChange,
  onProgressChange,
}: {
  uppy: Uppy
  onStatusChange: (status: UploadStatus) => void
  onProgressChange: (progress: number) => void
}): { cleanup: () => void } {
  const onFileAdded = () => {
    onStatusChange('ready')
  }
  const onUploadStarted = () => {
    onStatusChange('uploading')
  }
  const onResumeAll = () => {
    onStatusChange('uploading')
  }
  const onComplete = () => {
    onStatusChange('complete')
    onProgressChange(0)
  }
  const onError = () => {
    onStatusChange('error')
    onProgressChange(0)
  }
  const onCancelAll = () => {
    onStatusChange('init')
    onProgressChange(0)
  }
  const onPauseAll = () => {
    onStatusChange('paused')
  }
  const onProgress = (p: number) => {
    onProgressChange(p)
  }

  uppy.on('file-added', onFileAdded)
  uppy.on('progress', onProgress)
  uppy.on('upload', onUploadStarted)
  uppy.on('complete', onComplete)
  uppy.on('error', onError)
  uppy.on('cancel-all', onCancelAll)
  uppy.on('pause-all', onPauseAll)
  uppy.on('resume-all', onResumeAll)

  return {
    cleanup: () => {
      uppy.off('file-added', onFileAdded)
      uppy.off('progress', onProgress)
      uppy.off('upload', onUploadStarted)
      uppy.off('complete', onComplete)
      uppy.off('error', onError)
      uppy.off('cancel-all', onCancelAll)
      uppy.off('pause-all', onPauseAll)
      uppy.off('resume-all', onResumeAll)
    },
  }
}
