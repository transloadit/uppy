import { useMemo, useContext, useEffect } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js'
import { createWebcamStore, type WebcamSnapshot } from '@uppy/components'
import { UppyContext } from './headless/UppyContextProvider.js'

export function useWebcam(): WebcamSnapshot {
  const { uppy } = useContext(UppyContext)

  if (!uppy) {
    throw new Error(
      'Uppy instance is not available. Please provide it directly or through UppyContext.',
    )
  }

  const webcam = useMemo(() => createWebcamStore(uppy), [uppy])
  const store = useSyncExternalStore(
    webcam.subscribe,
    webcam.getSnapshot,
    webcam.getSnapshot,
  )

  console.log('state', store.state)

  useEffect(() => {
    webcam.start()
    return () => {
      webcam.destroy()
    }
  }, [webcam])

  return store
}
