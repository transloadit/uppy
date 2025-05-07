import type { Uppy, UppyEventMap } from '@uppy/core'
import type { WebcamState, WebcamStatus } from '@uppy/webcam'
import Webcam from '@uppy/webcam'
import type { HTMLAttributes } from 'preact/compat'

// Define the controller function's return type
// No longer exports state directly, that's handled by getSnapshot
export type WebcamController = {
  status: WebcamStatus
  getVideoProps: (
    ref: HTMLVideoElement | null,
  ) => HTMLAttributes<HTMLVideoElement>
  getSnapshotButtonProps: () => HTMLAttributes<HTMLButtonElement>
  getRecordButtonProps: () => HTMLAttributes<HTMLButtonElement>
  getStopRecordingButtonProps: () => HTMLAttributes<HTMLButtonElement>
  getSubmitButtonProps: () => HTMLAttributes<HTMLButtonElement>
  getDiscardButtonProps: () => HTMLAttributes<HTMLButtonElement>
  destroy: () => void
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => {
    status: WebcamStatus
    recordedVideo: string | null
    cameraError: Error | null
  }
  start: () => void
}

// Define the controller function
export function createWebcamController(uppy: Uppy): WebcamController {
  const plugin = uppy.getPlugin<Webcam<any, any>>('Webcam')

  if (!plugin) {
    throw new Error(
      'Webcam plugin is not installed. Please install it using `uppy.use(Webcam)` before using the controller.',
    )
  }

  let currentState: WebcamState = plugin.getPluginState()

  // --- Store subscription logic ---
  const listeners: Set<() => void> = new Set()
  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }
  const emitChange = () => {
    listeners.forEach((listener) => listener())
  }

  const getSnapshot = () => {
    return currentState
  }

  const onStateUpdate: UppyEventMap<any, any>['state-update'] = (
    prev,
    next,
    patch,
  ) => {
    const webcamPatch = patch?.plugins?.Webcam as WebcamState | undefined
    if (webcamPatch) {
      currentState = { ...currentState, ...webcamPatch }
      emitChange()
    }
  }
  uppy.on('state-update', onStateUpdate)

  // Prop Getters - these now read from getSnapshot() where needed
  const getVideoProps = (ref: HTMLVideoElement | null) => {
    plugin.getVideoElement = () => ref
    const { status, recordedVideo } = getSnapshot()
    if (status === 'captured' && recordedVideo) {
      if (ref) {
        // eslint-disable-next-line no-param-reassign
        ref.srcObject = null
      }
      return {
        playsInline: true,
        controls: true,
        muted: false,
        src: recordedVideo,
        autoPlay: undefined,
      }
    }

    if (ref) {
      // eslint-disable-next-line no-param-reassign
      ref.srcObject = plugin.stream
    }

    // Live preview
    return {
      style: {
        transform: 'scaleX(-1)',
      },
      playsInline: true,
      autoPlay: true,
      muted: true,
      controls: undefined,
    }
  }

  const getSnapshotButtonProps = (): HTMLAttributes<HTMLButtonElement> => ({
    type: 'button',
    onClick: async () => {
      await plugin.takeSnapshot()
      await plugin.stop()
    },
    // Disable if not ready, or if currently recording (even if ready)
    disabled: getSnapshot().status !== 'ready' || currentState.isRecording,
  })

  const getRecordButtonProps = (): HTMLAttributes<HTMLButtonElement> => ({
    type: 'button',
    onClick: () => {
      plugin.startRecording()
    },
    disabled: getSnapshot().status !== 'ready' || currentState.isRecording,
  })

  const getStopRecordingButtonProps =
    (): HTMLAttributes<HTMLButtonElement> => ({
      type: 'button',
      onClick: () => {
        plugin.stopRecording()
      },
      disabled: getSnapshot().status !== 'recording',
    })

  const getSubmitButtonProps = (): HTMLAttributes<HTMLButtonElement> => ({
    type: 'button',
    onClick: () => {
      plugin.submit()
      plugin.stop()
      currentState.recordedVideo = null
    },
    disabled: getSnapshot().status !== 'captured',
  })

  const getDiscardButtonProps = (): HTMLAttributes<HTMLButtonElement> => ({
    type: 'button',
    onClick: () => {
      plugin.discardRecordedVideo()
      currentState.recordedVideo = null
    },
    disabled: getSnapshot().status !== 'captured',
  })

  const destroy = () => {
    uppy.off('state-update', onStateUpdate)
    listeners.clear()
    if (plugin.webcamActive || currentState.isRecording) {
      plugin.stop().catch((err) => console.error('Error stopping webcam:', err))
    }
  }

  const start = () => {
    uppy.on('state-update', onStateUpdate)
    plugin.start()
  }

  // Return the controller interface
  // We use getters to ensure consumers always get the latest value
  // No longer returning state getters
  return {
    status: currentState.status,
    getVideoProps,
    getSnapshotButtonProps,
    getRecordButtonProps,
    getStopRecordingButtonProps,
    getSubmitButtonProps,
    getDiscardButtonProps,
    destroy,
    // Added for useSyncExternalStore
    subscribe,
    getSnapshot,
    start,
  }
}
