import type { Uppy, UppyEventMap } from '@uppy/core'
import type { WebcamState, WebcamStatus } from '@uppy/webcam'
import Webcam from '@uppy/webcam'

export type { WebcamStatus }

export type WebcamSnapshot = {
  status: WebcamStatus
  recordedVideo: string | null
  cameraError: Error | null
}

type ButtonProps = {
  type: 'button'
  onClick: () => void
  disabled: boolean
}

// Define the controller function's return type
// No longer exports state directly, that's handled by getSnapshot
export type WebcamController = {
  status: WebcamStatus
  getVideoProps: (ref: HTMLVideoElement | null) => {
    style?: {
      transform: string
    }
    playsInline: boolean
    autoPlay?: boolean
    muted: boolean
    controls?: boolean | undefined
    src?: string
  }
  getSnapshotButtonProps: () => ButtonProps
  getRecordButtonProps: () => ButtonProps
  getStopRecordingButtonProps: () => ButtonProps
  getSubmitButtonProps: () => ButtonProps
  getDiscardButtonProps: () => ButtonProps
  destroy: () => void
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => WebcamSnapshot
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

  const getSnapshotButtonProps = () => ({
    type: 'button' as const,
    onClick: async () => {
      await plugin.takeSnapshot()
      await plugin.stop()
    },
    disabled: getSnapshot().status !== 'ready' || currentState.isRecording,
  })

  const getRecordButtonProps = () => ({
    type: 'button' as const,
    onClick: () => {
      plugin.startRecording()
    },
    disabled: getSnapshot().status !== 'ready' || currentState.isRecording,
  })

  const getStopRecordingButtonProps = () => ({
    type: 'button' as const,
    onClick: () => {
      plugin.stopRecording()
    },
    disabled: getSnapshot().status !== 'recording',
  })

  const getSubmitButtonProps = () => ({
    type: 'button' as const,
    onClick: () => {
      plugin.submit()
      plugin.stop()
      currentState.recordedVideo = null
    },
    disabled: getSnapshot().status !== 'captured',
  })

  const getDiscardButtonProps = () => ({
    type: 'button' as const,
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
      plugin.stop()
    }
  }

  const start = () => {
    uppy.on('state-update', onStateUpdate)
    plugin.start()
  }

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
