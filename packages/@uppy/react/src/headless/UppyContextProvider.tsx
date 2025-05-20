import React, {
  createContext,
  useState,
  useEffect,
  createElement as h,
} from 'react'
import type Uppy from '@uppy/core'
import { createUppyEventAdapter, type UploadStatus } from '@uppy/core'

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

    const uppyEventAdapter = createUppyEventAdapter({
      uppy,
      onStatusChange: (newStatus: UploadStatus) => {
        setStatus(newStatus)
      },
      onProgressChange: (newProgress: number) => {
        setProgress(newProgress)
      },
    })

    return () => uppyEventAdapter.cleanup()
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
