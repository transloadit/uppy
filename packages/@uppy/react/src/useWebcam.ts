import { createWebcamController, type WebcamSnapshot } from '@uppy/components'
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { useUppyContext } from './headless/UppyContextProvider.js'

type WebcamProps = {
  onSubmit?: (() => void) | undefined
}

export function useWebcam(props?: WebcamProps): WebcamSnapshot {
  const { uppy } = useUppyContext()

  // A new controller would get new `start`/`stop` functions, which restarts
  // the camera in effects that depend on them, so read the latest callback
  // through a ref instead.
  const onSubmitRef = useRef(props?.onSubmit)
  useEffect(() => {
    onSubmitRef.current = props?.onSubmit
  })

  const controller = useMemo(
    () => createWebcamController(uppy, () => onSubmitRef.current?.()),
    [uppy],
  )
  const store = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  )

  return store
}
