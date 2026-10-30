import {
  createScreenCaptureController,
  type ScreenCaptureSnapshot,
} from '@uppy/components'
import { useEffect, useMemo, useRef } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim'
import { useUppyContext } from './headless/UppyContextProvider.js'

type ScreenCaptureProps = {
  onSubmit?: (() => void) | undefined
}

export function useScreenCapture(
  props?: ScreenCaptureProps,
): ScreenCaptureSnapshot {
  const { uppy } = useUppyContext()

  // A new controller would get new `start`/`stop` functions, which restarts
  // the capture in effects that depend on them, so read the latest callback
  // through a ref instead.
  const onSubmitRef = useRef(props?.onSubmit)
  useEffect(() => {
    onSubmitRef.current = props?.onSubmit
  })

  const controller = useMemo(
    () => createScreenCaptureController(uppy, () => onSubmitRef.current?.()),
    [uppy],
  )
  const store = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  )
  return store
}
