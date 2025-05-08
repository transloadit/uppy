import { useMemo, useContext, useEffect } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js'
import {
  createWebcamController,
  type WebcamController,
  type WebcamSnapshot,
} from '@uppy/components'
import { UppyContext } from './headless/UppyContextProvider.js'

type UseWebcamResult = Omit<
  WebcamController,
  'destroy' | 'subscribe' | 'getSnapshot' | 'start'
> &
  WebcamSnapshot

export function useWebcam(): UseWebcamResult {
  const { uppy } = useContext(UppyContext)

  if (!uppy) {
    throw new Error(
      'Uppy instance is not available. Please provide it directly or through UppyContext.',
    )
  }

  const controller = useMemo(() => createWebcamController(uppy), [uppy])

  const { status, cameraError, recordedVideo } = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot, // Server snapshot (can be same as client initially)
  )

  useEffect(() => {
    controller.start()
    return () => {
      controller.destroy()
    }
  }, [controller])

  return {
    status,
    cameraError,
    recordedVideo,
    getVideoProps: controller.getVideoProps,
    getSnapshotButtonProps: controller.getSnapshotButtonProps,
    getRecordButtonProps: controller.getRecordButtonProps,
    getStopRecordingButtonProps: controller.getStopRecordingButtonProps,
    getSubmitButtonProps: controller.getSubmitButtonProps,
    getDiscardButtonProps: controller.getDiscardButtonProps,
  }
}
