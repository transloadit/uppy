import { useMemo, useContext } from 'react'
// Import useSyncExternalStore compat version
import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js'
import type { Uppy } from '@uppy/core'
// Import from @uppy/components first
import { createWebcamController, type WebcamController } from '@uppy/components'
// Then import local context provider
import { UppyContext } from './headless/UppyContextProvider.js'

// Define the return type for the hook
// It now directly reflects the WebcamController type excluding destroy/subscribe/getSnapshot
type UseWebcamResult = Omit<
  WebcamController,
  'destroy' | 'subscribe' | 'getSnapshot'
> & {
  // Add the state properties explicitly
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

  // Create the controller instance once per uppy instance
  const controller = useMemo(() => createWebcamController(uppy), [uppy])

  // Subscribe to the controller's state using useSyncExternalStore
  const { status, recordedVideo, error } = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot, // Server snapshot (can be same as client initially)
  )

  // Return the reactive state from useSyncExternalStore and the prop getters
  return {
    status,
    recordedVideo,
    error,
    getVideoProps: controller.getVideoProps,
    getSnapshotButtonProps: controller.getSnapshotButtonProps,
    getRecordButtonProps: controller.getRecordButtonProps,
    getStopRecordingButtonProps: controller.getStopRecordingButtonProps,
    getSubmitButtonProps: controller.getSubmitButtonProps,
    getDiscardButtonProps: controller.getDiscardButtonProps,
    getVideoSourceSelectProps: controller.getVideoSourceSelectProps,
  }
}
