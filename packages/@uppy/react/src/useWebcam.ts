import { useMemo, useContext } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js'
import { createWebcamController, type WebcamSnapshot } from '@uppy/components'
import { UppyContext } from './headless/UppyContextProvider.js'

type WebcamProps = {
  onSubmit: () => void
}

export function useWebcam({ onSubmit }: WebcamProps): WebcamSnapshot {
  const { uppy } = useContext(UppyContext)

  if (!uppy) {
    throw new Error(
      'Uppy instance is not available. Please provide it directly or through UppyContext.',
    )
  }

  const controller = useMemo(
    () => createWebcamController(uppy, onSubmit),
    [uppy, onSubmit],
  )
  const store = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  )

  return store
}
