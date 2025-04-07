import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import type Uppy from '@uppy/core'
import Context, { type UploadStatus } from './uppy.context.js'

type Props = {
  uppy: Uppy
  children: any
}

function UppyContextProvider(props: Props) {
  const [status, setStatus] = useState<UploadStatus>('init')
  const [progress, setProgress] = useState(0)
  const { uppy, children } = props

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
    <Context.Provider
      value={{
        uppy,
        status,
        progress,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export default UppyContextProvider
