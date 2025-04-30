import type { Uppy, UppyEventMap } from '@uppy/core'
import type { WebcamState as UppyWebcamState } from '@uppy/webcam'
import Webcam from '@uppy/webcam'
import type { HTMLAttributes } from 'preact/compat'
import type { RefCallback } from 'preact'

// Define the simplified status enum
export type WebcamStatus =
  | 'init' // before any permissions request
  | 'permissionDenied' // user denied camera access
  | 'ready' // live preview streaming
  | 'recording' // currently recording
  | 'captured' // snapshot or video captured, preview available
  | 'error' // fatal error (e.g. no camera, permission error)

// Re-export WebcamState from the plugin but make props optional for the hook's internal state
export type WebcamState = Partial<UppyWebcamState>

// Define the controller function's return type
// No longer exports state directly, that's handled by getSnapshot
export type WebcamController = {
  // status: WebcamStatus // Removed
  // recordedVideo: string | null // Removed
  // error: Error | null // Removed
  getVideoProps: () => HTMLAttributes<HTMLVideoElement> & {
    ref: RefCallback<HTMLVideoElement>
    srcObject?: MediaStream
  }
  getSnapshotButtonProps: () => HTMLAttributes<HTMLButtonElement>
  getRecordButtonProps: () => HTMLAttributes<HTMLButtonElement>
  getStopRecordingButtonProps: () => HTMLAttributes<HTMLButtonElement>
  getSubmitButtonProps: () => HTMLAttributes<HTMLButtonElement>
  getDiscardButtonProps: () => HTMLAttributes<HTMLButtonElement>
  getVideoSourceSelectProps: () => HTMLAttributes<HTMLSelectElement> & {
    options: Array<{ value: string; label: string }>
  }
  destroy: () => void
  // Added for useSyncExternalStore
  subscribe: (onStoreChange: () => void) => () => void
  getSnapshot: () => {
    status: WebcamStatus
    recordedVideo: string | null
    error: Error | null
  }
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
  // No longer need separate state vars for status/error here
  // let currentStatus: WebcamStatus = 'init'
  // let currentError: Error | null = null
  let videoElementRef: HTMLVideoElement | null = null

  // --- Store subscription logic ---
  const listeners: Set<() => void> = new Set()
  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }
  const emitChange = () => {
    listeners.forEach((listener) => listener())
  }
  // -------------------------------

  // Helper to check if MediaRecorder is likely supported
  // Copied from @uppy/webcam/src/supportsMediaRecorder.js as it's not exported
  const supportsMediaRecorder = (): boolean =>
    typeof MediaRecorder !== 'undefined' &&
    // eslint-disable-next-line compat/compat
    !!MediaRecorder.prototype &&
    // eslint-disable-next-line compat/compat
    !!MediaRecorder.prototype.start

  const mapStateToStatus = (state: WebcamState): WebcamStatus => {
    if (state.cameraError) {
      if (
        state.cameraError.name === 'NotAllowedError' ||
        state.cameraError.message.includes('permission denied')
      ) {
        return 'permissionDenied'
      }
      return 'error'
    }
    if (state.recordedVideo != null) return 'captured'
    if (state.isRecording) return 'recording'
    if (state.cameraReady && state.hasCamera) return 'ready'
    // Check for lack of camera/support after other checks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (
      !plugin.supportsUserMedia ||
      (state.hasCamera === false && !state.cameraReady)
    )
      return 'error'
    return 'init'
  }

  // Retrieves the current snapshot of the relevant state
  const getSnapshot = () => {
    const status = mapStateToStatus(currentState)
    const recordedVideo = currentState.recordedVideo ?? null
    const error = currentState.cameraError ?? null
    return { status, recordedVideo, error }
  }

  // Initialize state
  // currentStatus = mapStateToStatus(currentState)
  // currentError = currentState.cameraError || null

  // Subscribe to plugin state updates using the plugin's event emitter
  const onStateUpdate: UppyEventMap<any, any>['state-update'] = (
    prev,
    next,
    patch,
  ) => {
    const webcamPatch = patch?.plugins?.Webcam as WebcamState | undefined
    if (webcamPatch) {
      const oldSnapshot = getSnapshot()
      // Update internal state reference
      currentState = { ...currentState, ...webcamPatch }
      const newSnapshot = getSnapshot()

      // Check if derived state actually changed before notifying listeners
      if (
        oldSnapshot.status !== newSnapshot.status ||
        oldSnapshot.recordedVideo !== newSnapshot.recordedVideo ||
        oldSnapshot.error !== newSnapshot.error
      ) {
        emitChange()
      }
    }
  }
  uppy.on('state-update', onStateUpdate)

  // Ref callback for the video element
  const videoRefCallback: RefCallback<HTMLVideoElement> = (
    element: HTMLVideoElement | null,
  ) => {
    videoElementRef = element
    // Read current status directly from snapshot inside the callback
    const currentStatus = getSnapshot().status
    if (videoElementRef && currentStatus !== 'captured') {
      // Apply stream when ref is available and not showing recorded video
      try {
        // Accessing plugin.stream directly might be risky if the plugin internally manages it.
        // Let's ensure the plugin is active and has a stream.
        if (plugin.webcamActive && plugin.stream) {
          videoElementRef.srcObject = plugin.stream
        } else {
          videoElementRef.srcObject = null // Explicitly clear if no stream
        }
      } catch (e) {
        console.error('Error setting video stream:', e)
        videoElementRef.srcObject = null
      }
    } else if (videoElementRef && currentStatus === 'captured') {
      // Ensure srcObject is null when we are showing recorded video via src
      videoElementRef.srcObject = null
    }
  }

  // Prop Getters - these now read from getSnapshot() where needed
  const getVideoProps = () => {
    const { status, recordedVideo } = getSnapshot()
    if (status === 'captured' && recordedVideo) {
      // Recorded video preview
      return {
        ref: videoRefCallback,
        playsInline: true,
        controls: true,
        muted: false,
        src: recordedVideo,
        // Ensure autoPlay and srcObject are explicitly undefined
        autoPlay: undefined,
        srcObject: undefined,
      }
    }

    // Live preview
    return {
      ref: videoRefCallback,
      playsInline: true,
      autoPlay: true,
      muted: true,
      // Use optional chaining and nullish coalescing for safety
      srcObject: plugin.stream ?? undefined,
      // Ensure controls and src are explicitly undefined
      controls: undefined,
      src: undefined,
    }
  }

  const getSnapshotButtonProps = (): HTMLAttributes<HTMLButtonElement> => ({
    type: 'button',
    onClick: () => {
      const { status } = getSnapshot()
      const { isRecording } = currentState
      if (status === 'ready' && !isRecording) plugin.takeSnapshot()
    },
    // Disable if not ready, or if currently recording (even if ready)
    disabled: getSnapshot().status !== 'ready' || currentState.isRecording,
  })

  const getRecordButtonProps = (): HTMLAttributes<HTMLButtonElement> => ({
    type: 'button',
    onClick: () => {
      const { status } = getSnapshot()
      const { isRecording } = currentState
      if (status === 'ready' && !isRecording && supportsMediaRecorder()) {
        plugin.startRecording()
      }
    },
    disabled:
      getSnapshot().status !== 'ready' ||
      currentState.isRecording ||
      !supportsMediaRecorder(),
  })

  const getStopRecordingButtonProps =
    (): HTMLAttributes<HTMLButtonElement> => ({
      type: 'button',
      onClick: () => {
        const { status } = getSnapshot()
        if (status === 'recording') plugin.stopRecording()
      },
      disabled: getSnapshot().status !== 'recording',
    })

  const getSubmitButtonProps = (): HTMLAttributes<HTMLButtonElement> => ({
    type: 'button',
    onClick: () => {
      const { status } = getSnapshot()
      if (status === 'captured') plugin.submit()
    },
    disabled: getSnapshot().status !== 'captured',
  })

  const getDiscardButtonProps = (): HTMLAttributes<HTMLButtonElement> => ({
    type: 'button',
    onClick: () => {
      const { status } = getSnapshot()
      if (status === 'captured') plugin.discardRecordedVideo()
    },
    disabled: getSnapshot().status !== 'captured',
  })

  const getVideoSourceSelectProps = (): HTMLAttributes<HTMLSelectElement> & {
    options: Array<{ value: string; label: string }>
  } => {
    const { status } = getSnapshot()
    // Raw state needed for sources and currentDeviceId
    const options =
      currentState.videoSources?.map((device) => ({
        value: device.deviceId,
        // Provide a fallback label if device.label is empty
        label: device.label || `Camera ${device.deviceId.substring(0, 8)}`,
      })) || []

    return {
      value: String(currentState.currentDeviceId ?? ''),
      onChange: (event: Event) => {
        const target = event.target as HTMLSelectElement
        if (target.value) plugin.changeVideoSource(target.value)
      },
      // Disable if fewer than 2 sources, or if recording/captured
      disabled:
        options.length < 2 || ['recording', 'captured'].includes(status),
      options,
    }
  }

  // Cleanup function
  const destroy = () => {
    uppy.off('state-update', onStateUpdate)
    listeners.clear() // Clear listeners
    // Only call stop if the plugin seems active to avoid potential errors
    if (plugin.webcamActive || currentState.isRecording) {
      plugin.stop().catch((err) => console.error('Error stopping webcam:', err))
    }
    videoElementRef = null
    // Clear state variables
    currentState = {}
    // currentStatus = 'init'
    // currentError = null
  }

  // Return the controller interface
  // We use getters to ensure consumers always get the latest value
  // No longer returning state getters
  return {
    // get status() { return getSnapshot().status }, // Removed
    // get recordedVideo() { return getSnapshot().recordedVideo }, // Removed
    // get error() { return getSnapshot().error }, // Removed
    getVideoProps,
    getSnapshotButtonProps,
    getRecordButtonProps,
    getStopRecordingButtonProps,
    getSubmitButtonProps,
    getDiscardButtonProps,
    getVideoSourceSelectProps,
    destroy,
    // Added for useSyncExternalStore
    subscribe,
    getSnapshot,
  }
}
