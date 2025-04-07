import React, {
  createContext,
  useState,
  useEffect,
  createElement as h,
} from 'react'
import type Uppy from '@uppy/core'

export type UploadStatus =
  | 'init'
  | 'ready'
  | 'uploading'
  | 'paused'
  | 'error'
  | 'complete'

interface UppyContextValue {
  uppy: Uppy | undefined
  status: UploadStatus
  progress: number
}

export const UppyContext = createContext<UppyContextValue>({
  uppy: undefined,
  status: 'init',
  progress: 0,
})

interface Props {
  uppy: Uppy
  children: React.ReactNode
}

export function UppyContextProvider({ uppy, children }: Props) {
  const [status, setStatus] = useState<UploadStatus>('init')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!uppy) {
      throw new Error(
        'UppyContextProvider: passing `uppy` as a prop is required',
      )
    }

    const onUploadStarted = () => {
      setStatus('uploading')
    }
    const onComplete = () => {
      setStatus('complete')
      setProgress(0)
    }
    const onError = () => {
      setStatus('error')
      setProgress(0)
    }
    const onProgress = (p: number) => {
      setProgress(p)
    }
    const onCancelAll = () => {
      setStatus('init')
      setProgress(0)
    }
    const onFileAdded = () => {
      setStatus('ready')
    }
    const onPauseAll = () => {
      setStatus('paused')
    }
    const onResumeAll = () => {
      setStatus('uploading')
    }

    uppy.on('file-added', onFileAdded)
    uppy.on('progress', onProgress)
    uppy.on('upload', onUploadStarted)
    uppy.on('complete', onComplete)
    uppy.on('error', onError)
    uppy.on('cancel-all', onCancelAll)
    uppy.on('pause-all', onPauseAll)
    uppy.on('resume-all', onResumeAll)

    return () => {
      uppy.off('file-added', onFileAdded)
      uppy.off('progress', onProgress)
      uppy.off('upload', onUploadStarted)
      uppy.off('complete', onComplete)
      uppy.off('error', onError)
      uppy.off('cancel-all', onCancelAll)
      uppy.off('pause-all', onPauseAll)
      uppy.off('resume-all', onResumeAll)
    }
  }, [uppy])

  return (
    <UppyContext.Provider
      value={{
        uppy,
        status,
        progress,
      }}
    >
      {children}
    </UppyContext.Provider>
  )
}

export default UppyContextProvider
