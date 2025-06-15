import type { Uppy, UppyEventMap } from '@uppy/core'
import type { ScreenCaptureState } from '@uppy/screen-capture'
import ScreenCapture from '@uppy/screen-capture'

// export type ScreenCaptureStatus =
//   | 'init'
//   | 'ready'
//   | 'recording'
//   | 'captured'
//   | 'error'
//   | 'recorded'

type ButtonProps = {
  type: 'button'
  onClick: () => void
  disabled: boolean
}

export type ScreenCaptureSnapshot = {
  state: ScreenCaptureState
  stop: () => void
  start: () => void
  getMediaProps: () => {
    playsInline: boolean
    autoPlay?: boolean
    muted: boolean
    controls?: boolean | undefined
    src?: string
  }
  getScreenshotButtonProps: () => ButtonProps
  getRecordButtonProps: () => ButtonProps
  getStopRecordingButtonProps: () => ButtonProps
  getSubmitButtonProps: () => ButtonProps
  getDiscardButtonProps: () => ButtonProps
}

export type ScreenCaptureStore = {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => ScreenCaptureSnapshot
}

const videoId = 'uppy-screencapture-video'

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

export function createScreenCaptureController(
  uppy: Uppy,
  onSubmit?: () => void,
): ScreenCaptureStore {
  const plugin = uppy.getPlugin<ScreenCapture<any, any>>('ScreenCapture')
  if (!plugin) {
    throw new Error(
      'ScreenCapture plugin is not installed. Install @uppy/screen-capture and add it to the Uppy instance with `uppy.use(ScreenCapture)`.',
    )
  }
  const subscribers = new Subscribers()

  const onStateUpdate: UppyEventMap<any, any>['state-update'] = (
    prev,
    next,
    patch,
  ): void => {
    const screenCapturePatch = patch?.plugins?.ScreenCapture as
      | ScreenCaptureState
      | undefined

    if (screenCapturePatch) {
      subscribers.emit()
    }
  }

  const stop = () => {
    uppy.off('state-update', onStateUpdate)
    plugin.stop()
  }

  const start = () => {
    uppy.on('state-update', onStateUpdate)
    plugin.start()
  }

  const getMediaProps = () => {
    const ref = document.getElementById(videoId) as HTMLVideoElement | null
    const { status, recordedVideo, capturedScreenshotUrl } =
      plugin.getPluginState()
    if (status === 'recorded' && recordedVideo) {
      if (ref) {
        ref.srcObject = null
      }
      return {
        id: videoId,
        playsInline: true,
        controls: true,
        muted: false,
        src: recordedVideo,
        autoPlay: undefined,
      }
    }
    if (status === 'captured' && capturedScreenshotUrl) {
      if (ref) {
        ref.srcObject = null
      }
      return {
        id: videoId,
        playsInline: true,
        controls: false,
        muted: false,
        poster: capturedScreenshotUrl,
        autoPlay: undefined,
      }
    }
    if (
      ref &&
      plugin.videoStream &&
      !(capturedScreenshotUrl || recordedVideo)
    ) {
      ref.srcObject = plugin.videoStream
    }

    return {
      id: videoId,
      playsInline: true,
      autoPlay: true,
      muted: true,
      controls: undefined,
    }
  }

  const getScreenshotButtonProps = () => {
    const { status } = plugin.getPluginState()
    return {
      type: 'button' as const,
      onClick: async () => {
        await plugin.captureScreenshot()
      },
      disabled: status !== 'ready',
    }
  }

  const getRecordButtonProps = () => {
    const { status } = plugin.getPluginState()
    return {
      type: 'button' as const,
      onClick: () => {
        plugin.startRecording()
      },
      disabled: status !== 'ready',
    }
  }

  const getStopRecordingButtonProps = () => {
    const { status } = plugin.getPluginState()
    return {
      type: 'button' as const,
      onClick: () => {
        plugin.stopRecording()
      },
      disabled: status !== 'recording',
    }
  }

  const getSubmitButtonProps = () => {
    const { status } = plugin.getPluginState()
    return {
      type: 'button' as const,
      onClick: () => {
        plugin.submit()
        plugin.stop()
        onSubmit?.()
      },
      disabled: !(status === 'captured' || status === 'recorded'),
    }
  }

  const getDiscardButtonProps = () => {
    const { status } = plugin.getPluginState()
    return {
      type: 'button' as const,
      onClick: () => {
        plugin.discardRecordedMedia()
      },
      disabled: !(status === 'captured' || status === 'recorded'),
    }
  }

  let cachedState = plugin.getPluginState()
  let snapshot: ScreenCaptureSnapshot = {
    state: cachedState,
    stop,
    start,
    getMediaProps,
    getScreenshotButtonProps,
    getRecordButtonProps,
    getStopRecordingButtonProps,
    getSubmitButtonProps,
    getDiscardButtonProps,
  }

  const getSnapshot = () => {
    const nextState = plugin.getPluginState()
    if (nextState === cachedState) return snapshot
    cachedState = nextState
    snapshot = { ...snapshot, state: nextState }
    return snapshot
  }

  return { subscribe: subscribers.add, getSnapshot }
}
