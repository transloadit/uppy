import type Uppy from '@uppy/core'
import type { UppyEventMap } from '@uppy/core'
import type { UploadStatus } from './types.js'

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
  const onFileRemoved = () => {
    if (uppy.getFiles().length === 0) {
      onStatusChange('init')
    }
  }
  const onUploadStarted = () => {
    onStatusChange('uploading')
  }
  const onResumeAll = () => {
    onStatusChange('uploading')
  }
  const onComplete: UppyEventMap<any, any>['complete'] = (result) => {
    // If there are no uploads in failed or successful 'cancel-all' was called.
    // Because 'complete' is called afterwards, we don't want to set the status to 'complete'
    if (result?.failed?.length || result?.successful?.length) {
      onStatusChange('complete')
      onProgressChange(0)
    }
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
  uppy.on('file-removed', onFileRemoved)
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
