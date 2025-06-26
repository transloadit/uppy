import {
  createUppyEventAdapter,
  type NonNullableUppyContext,
  type UploadStatus,
} from '@uppy/components'
import type Uppy from '@uppy/core'
import type React from 'react'
import {
  createContext,
  createElement as h,
  useContext,
  useEffect,
  useState,
} from 'react'

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

export function useUppyContext(): NonNullableUppyContext {
  const ctx = useContext(UppyContext)

  if (!ctx.uppy) {
    throw new Error('Uppy hooks must be called within a UppyContextProvider')
  }

  return ctx as NonNullableUppyContext // covered by the if statement above
}
