import { useMemo, useContext, useEffect } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js'
import type { Uppy } from '@uppy/core'
import { createWebcamController, type WebcamController } from '@uppy/components'
import { UppyContext } from './headless/UppyContextProvider.js'

type UseWebcamResult = Omit<
  WebcamController,
  'destroy' | 'subscribe' | 'getSnapshot' | 'start'
> & {
  status: WebcamController['getSnapshot']['prototype']['status']
  recordedVideo: WebcamController['getSnapshot']['prototype']['recordedVideo']
  error: WebcamController['getSnapshot']['prototype']['error']
}

/**
 * React hook to manage the Webcam component.
 *
 * @param uppyInstance - Optional Uppy instance. If not provided, it will be obtained from UppyContext.
 * @returns An object with webcam status, state, and prop getters.
 */
export function useWebcam(uppyInstance?: Uppy): UseWebcamResult {
  const ctx = useContext(UppyContext)
  const uppy = uppyInstance ?? ctx.uppy

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
    error: cameraError,
    recordedVideo,
    getVideoProps: controller.getVideoProps,
    getSnapshotButtonProps: controller.getSnapshotButtonProps,
    getRecordButtonProps: controller.getRecordButtonProps,
    getStopRecordingButtonProps: controller.getStopRecordingButtonProps,
    getSubmitButtonProps: controller.getSubmitButtonProps,
    getDiscardButtonProps: controller.getDiscardButtonProps,
  }
}
