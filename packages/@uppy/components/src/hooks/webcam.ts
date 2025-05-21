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
  getVideoProps: () => {
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
}

export type WebcamStore = {
  destroy: () => void
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => WebcamSnapshot
  start: () => void
}

const videoId = 'uppy-webcam-video'

export function createWebcamStore(uppy: Uppy): WebcamStore {
  const plugin = uppy.getPlugin<Webcam<any, any>>('Webcam')

  if (!plugin) {
    throw new Error(
      'Webcam plugin is not installed. Install @uppy/webcam and add it to the Uppy instance with `uppy.use(Webcam)`.',
    )
  }

  // --- Store subscription logic ---
  const listeners: Set<() => void> = new Set()
  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }
  const emitChange = () => {
    listeners.forEach((listener) => listener())
  }

  const onStateUpdate: UppyEventMap<any, any>['state-update'] = (
    prev,
    next,
    patch,
  ) => {
    const webcamPatch = patch?.plugins?.Webcam as WebcamState | undefined
    if (webcamPatch) {
      emitChange()
    }
  }
  uppy.on('state-update', onStateUpdate)

  const destroy = () => {
    uppy.off('state-update', onStateUpdate)
    listeners.clear()
    if (plugin.webcamActive || plugin.getPluginState().isRecording) {
      plugin.stop()
    }
  }

  const start = () => {
    uppy.on('state-update', onStateUpdate)
    plugin.start()
  }

  const getSnapshot = () => {
    return {
      state: plugin.getPluginState(),
      getVideoProps: () => {
        const ref = document.getElementById(videoId) as HTMLVideoElement | null
        plugin.getVideoElement = () => ref
        const { status, recordedVideo } = plugin.getPluginState()
        if (status === 'captured' && recordedVideo) {
          if (ref) {
            // eslint-disable-next-line no-param-reassign
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

        if (ref) {
          // eslint-disable-next-line no-param-reassign
          ref.srcObject = plugin.stream
        }

        // Live preview
        return {
          id: videoId,
          style: {
            transform: 'scaleX(-1)',
          },
          playsInline: true,
          autoPlay: true,
          muted: true,
          controls: undefined,
        }
      },

      getSnapshotButtonProps: () => ({
        type: 'button' as const,
        onClick: async () => {
          await plugin.takeSnapshot()
          await plugin.stop()
        },
        disabled:
          plugin.getPluginState().status !== 'ready' ||
          plugin.getPluginState().isRecording,
      }),

      getRecordButtonProps: () => ({
        type: 'button' as const,
        onClick: () => {
          plugin.startRecording()
        },
        disabled:
          plugin.getPluginState().status !== 'ready' ||
          plugin.getPluginState().isRecording,
      }),

      getStopRecordingButtonProps: () => ({
        type: 'button' as const,
        onClick: () => {
          plugin.stopRecording()
        },
        disabled: plugin.getPluginState().status !== 'recording',
      }),

      getSubmitButtonProps: () => ({
        type: 'button' as const,
        onClick: () => {
          plugin.submit()
          plugin.stop()
          plugin.getPluginState().recordedVideo = null
        },
        disabled: plugin.getPluginState().status !== 'captured',
      }),

      getDiscardButtonProps: () => ({
        type: 'button' as const,
        onClick: () => {
          plugin.discardRecordedVideo()
          plugin.getPluginState().recordedVideo = null
        },
        disabled: plugin.getPluginState().status !== 'captured',
      }),
    }
  }

  return {
    destroy,
    subscribe,
    getSnapshot,
    start,
  }
}
