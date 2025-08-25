import { createWebcamController, type WebcamSnapshot } from '@uppy/components'
import { useMemo, useSyncExternalStore } from 'react'
import { useUppyContext } from './headless/UppyContextProvider.js'

type WebcamProps = {
  onSubmit: () => void
}

export function useWebcam({ onSubmit }: WebcamProps): WebcamSnapshot {
  const { uppy } = useUppyContext()

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
