import type { Uppy, UppyEventMap } from '@uppy/core'
import type { WebcamState, WebcamStatus } from '@uppy/webcam'
import Webcam from '@uppy/webcam'

export type { WebcamStatus }

type ButtonProps = {
  type: 'button'
  onClick: () => void
  disabled: boolean
}

export type WebcamSnapshot = {
  state: WebcamState
  stop: () => void
  start: () => void
  getVideoProps: () => {
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
}

export type WebcamStore = {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => WebcamSnapshot
}

const videoId = 'uppy-webcam-video'

class Subscribers {
  private subscribers: Set<() => void> = new Set()

  add = (listener: () => void): (() => void) => {
    this.subscribers.add(listener)
    return () => this.subscribers.delete(listener)
  }

  emit = (): void => {
    for (const listener of this.subscribers) {
      listener()
    }
  }

  clear = (): void => {
    this.subscribers.clear()
  }
}

export function createWebcamController(
  uppy: Uppy,
  onSubmit?: () => void,
): WebcamStore {
  const plugin = uppy.getPlugin<Webcam<any, any>>('Webcam')

  if (!plugin) {
    throw new Error(
      'Webcam plugin is not installed. Install @uppy/webcam and add it to the Uppy instance with `uppy.use(Webcam)`.',
    )
  }

  const subscribers = new Subscribers()

  const onStateUpdate: UppyEventMap<any, any>['state-update'] = (
    prev,
    next,
    patch,
  ) => {
    const webcamPatch = patch?.plugins?.Webcam as WebcamState | undefined
    if (webcamPatch) {
      subscribers.emit()
    }
  }

  const stop = () => {
    uppy.off('state-update', onStateUpdate)
    if (plugin.webcamActive || plugin.getPluginState().isRecording) {
      plugin.stop()
    }
  }

  const start = () => {
    uppy.on('state-update', onStateUpdate)
    plugin.start()
  }

  const getVideoProps = () => {
    const ref = document.getElementById(videoId) as HTMLVideoElement | null
    plugin.getVideoElement = () => ref
    const { status, recordedVideo } = plugin.getPluginState()

    if (status === 'captured' && recordedVideo) {
      if (ref) {
        // Remove preview image/video
        ref.srcObject = null
      }
      return {
        id: videoId,
        'data-uppy-mirrored': false,
        playsInline: true,
        controls: true,
        muted: false,
        src: recordedVideo,
        autoPlay: undefined,
      }
    }

    if (ref) {
      ref.srcObject = plugin.stream
    }

    // Live preview
    return {
      id: videoId,
      'data-uppy-mirrored': true,
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
      onSubmit?.()
    },
    disabled:
      plugin.getPluginState().status !== 'ready' ||
      plugin.getPluginState().isRecording,
  })

  const getRecordButtonProps = () => ({
    type: 'button' as const,
    onClick: () => {
      plugin.startRecording()
    },
    disabled:
      plugin.getPluginState().status !== 'ready' ||
      plugin.getPluginState().isRecording,
  })

  const getStopRecordingButtonProps = () => ({
    type: 'button' as const,
    onClick: () => {
      plugin.stopRecording()
    },
    disabled: plugin.getPluginState().status !== 'recording',
  })

  const getSubmitButtonProps = () => ({
    type: 'button' as const,
    onClick: () => {
      plugin.submit()
      plugin.stop()
      onSubmit?.()
    },
    disabled: plugin.getPluginState().status !== 'captured',
  })

  const getDiscardButtonProps = () => ({
    type: 'button' as const,
    onClick: () => {
      plugin.discardRecordedVideo()
    },
    disabled: plugin.getPluginState().status !== 'captured',
  })

  // Keep a cached snapshot so that the reference stays stable when nothing
  // has changed, as expected by `useSyncExternalStore` from React
  let cachedState = plugin.getPluginState()
  let snapshot: WebcamSnapshot = {
    state: cachedState,
    stop,
    start,
    getVideoProps,
    getSnapshotButtonProps,
    getRecordButtonProps,
    getStopRecordingButtonProps,
    getSubmitButtonProps,
    getDiscardButtonProps,
  }

  const getSnapshot = () => {
    const nextState = plugin.getPluginState()

    // If the reference hasn't changed we can safely return the cached
    // snapshot to avoid unnecessary re-renders.
    if (nextState === cachedState) return snapshot

    cachedState = nextState
    snapshot = {
      ...snapshot,
      state: nextState,
    }
    return snapshot
  }

  return { subscribe: subscribers.add, getSnapshot }
}
