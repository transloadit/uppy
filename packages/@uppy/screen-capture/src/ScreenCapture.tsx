import type {
  Body,
  DefinePluginOpts,
  Meta,
  UIPluginOptions,
  Uppy,
} from '@uppy/core'
import { UIPlugin } from '@uppy/core'
import getFileTypeExtension from '@uppy/utils/lib/getFileTypeExtension'
import type { LocaleStrings } from '@uppy/utils/lib/Translator'
import { type ComponentChild, h } from 'preact'
import packageJson from '../package.json' with { type: 'json' }
import locale from './locale.js'
import RecorderScreen from './RecorderScreen.js'
import ScreenRecIcon from './ScreenRecIcon.js'

// Check if screen capturing is supported.
// mediaDevices is supprted on mobile Safari, getDisplayMedia is not
function isScreenRecordingSupported() {
  return window.MediaRecorder && navigator.mediaDevices?.getDisplayMedia
}

// Adapted from: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
function getMediaDevices() {
  return window.MediaRecorder && navigator.mediaDevices
}

// Add supported image types
const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number]

export type ScreenCaptureStatus =
  | 'init'
  | 'ready'
  | 'recording'
  | 'captured'
  | 'error'

export interface ScreenCaptureOptions extends UIPluginOptions {
  displayMediaConstraints?: MediaStreamConstraints
  userMediaConstraints?: MediaStreamConstraints
  preferredVideoMimeType?: string
  preferredImageMimeType?: SupportedImageType
  locale?: LocaleStrings<typeof locale>
  enableScreenshots?: boolean
}

// https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamConstraints
const defaultOptions = {
  // https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints#Properties_of_shared_screen_tracks
  displayMediaConstraints: {
    video: {
      width: 1280,
      height: 720,
      frameRate: {
        ideal: 3,
        max: 5,
      },
      cursor: 'motion',
      displaySurface: 'monitor',
    },
  },
  // https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamConstraints/audio
  userMediaConstraints: {
    audio: true,
  },
  preferredVideoMimeType: 'video/webm',
  preferredImageMimeType: 'image/png' as SupportedImageType,
  enableScreenshots: true,
}

type Opts = DefinePluginOpts<ScreenCaptureOptions, keyof typeof defaultOptions>

export type ScreenCaptureState = {
  streamActive: boolean
  audioStreamActive: boolean
  recording: boolean
  recordedVideo: string | null
  screenRecError: Error | null
  capturedScreenshotUrl: string | null
  status: ScreenCaptureStatus
}

export default class ScreenCapture<
  M extends Meta,
  B extends Body,
> extends UIPlugin<Opts, M, B, ScreenCaptureState> {
  static VERSION = packageJson.version

  mediaDevices: MediaDevices

  protocol: string

  icon: ComponentChild

  streamInterrupted: () => void

  captureActive: boolean

  capturedMediaFile: null | {
    source: string
    name: string
    data: Blob
    type: string
  }

  videoStream: null | MediaStream = null

  audioStream: null | MediaStream = null

  userDenied: boolean = false

  recorder: null | MediaRecorder = null

  outputStream: null | MediaStream = null

  recordingChunks: Blob[] | null = null

  constructor(uppy: Uppy<M, B>, opts?: ScreenCaptureOptions) {
    super(uppy, { ...defaultOptions, ...opts })
    this.mediaDevices = getMediaDevices()
    this.protocol = location.protocol === 'https:' ? 'https' : 'http'
    this.id = this.opts.id || 'ScreenCapture'
    this.type = 'acquirer'
    this.icon = ScreenRecIcon

    this.defaultLocale = locale

    this.i18nInit()
    this.title = this.i18n('pluginNameScreenCapture')

    // uppy plugin class related
    this.install = this.install.bind(this)
    this.setPluginState = this.setPluginState.bind(this)
    this.render = this.render.bind(this)

    // screen capturer related
    this.start = this.start.bind(this)
    this.stop = this.stop.bind(this)
    this.startRecording = this.startRecording.bind(this)
    this.stopRecording = this.stopRecording.bind(this)
    this.submit = this.submit.bind(this)
    this.streamInterrupted = this.streamInactivated.bind(this)
    this.captureScreenshot = this.captureScreenshot.bind(this)
    this.discardRecordedMedia = this.discardRecordedMedia.bind(this)

    // initialize
    this.captureActive = false
    this.capturedMediaFile = null
    this.setPluginState({
      streamActive: false,
      audioStreamActive: false,
      recording: false,
      recordedVideo: null,
      screenRecError: null,
      capturedScreenshotUrl: null,
      status: 'init',
    })
  }

  install(): null | undefined {
    if (!isScreenRecordingSupported()) {
      this.uppy.log('Screen recorder access is not supported', 'warning')
      return null
    }

    this.setPluginState({
      streamActive: false,
      audioStreamActive: false,
      status: 'init',
    })

    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }

    return undefined
  }

  uninstall(): void {
    if (this.videoStream) {
      this.stop()
    }

    this.unmount()
  }

  start(): Promise<void> {
    if (!this.mediaDevices) {
      return Promise.reject(new Error('Screen recorder access not supported'))
    }

    this.captureActive = true

    this.selectAudioStreamSource()

    return this.selectVideoStreamSource().then((res) => {
      // something happened in start -> return
      if (res === false) {
        // Close the Dashboard panel if plugin is installed
        // into Dashboard (could be other parent UI plugin)
        // @ts-expect-error we can't know Dashboard types here
        if (this.parent?.hideAllPanels) {
          // @ts-expect-error we can't know Dashboard types here
          this.parent.hideAllPanels()
          this.captureActive = false
        }
      }
    })
  }

  selectVideoStreamSource(): Promise<MediaStream | false> {
    // if active stream available, return it
    if (this.videoStream) {
      return new Promise((resolve) => resolve(this.videoStream!))
    }

    // ask user to select source to record and get mediastream from that

    return this.mediaDevices
      .getDisplayMedia(this.opts.displayMediaConstraints)
      .then((videoStream) => {
        this.videoStream = videoStream

        // add event listener to stop recording if stream is interrupted
        this.videoStream.addEventListener('inactive', () => {
          this.streamInactivated()
        })

        this.setPluginState({
          streamActive: true,
          status: 'ready',
          screenRecError: null,
        })

        return videoStream
      })
      .catch((err) => {
        this.setPluginState({
          screenRecError: err,
          status: 'error',
        })

        this.userDenied = true

        setTimeout(() => {
          this.userDenied = false
        }, 1000)

        return false
      })
  }

  selectAudioStreamSource(): Promise<MediaStream | false> {
    // if active stream available, return it
    if (this.audioStream) {
      return new Promise((resolve) => resolve(this.audioStream!))
    }

    // ask user to select source to record and get mediastream from that

    return this.mediaDevices
      .getUserMedia(this.opts.userMediaConstraints)
      .then((audioStream) => {
        this.audioStream = audioStream

        this.setPluginState({
          audioStreamActive: true,
        })

        return audioStream
      })
      .catch((err) => {
        if (err.name === 'NotAllowedError') {
          this.uppy.info(this.i18n('micDisabled'), 'error', 5000)
          this.uppy.log(this.i18n('micDisabled'), 'warning')
        }
        return false
      })
  }

  startRecording(): void {
    const options: { mimeType?: string } = {}
    this.capturedMediaFile = null
    this.recordingChunks = []
    const { preferredVideoMimeType } = this.opts

    this.selectVideoStreamSource()
      .then((videoStream) => {
        if (videoStream === false) {
          throw new Error('No video stream available')
        }
        // Attempt to use the passed preferredVideoMimeType (if any) during recording.
        // If the browser doesn't support it, we'll fall back to the browser default instead
        if (
          preferredVideoMimeType &&
          MediaRecorder.isTypeSupported(preferredVideoMimeType) &&
          getFileTypeExtension(preferredVideoMimeType)
        ) {
          options.mimeType = preferredVideoMimeType
        }

        // prepare tracks
        const tracks = [videoStream.getVideoTracks()[0]]

        // merge audio if exits
        if (this.audioStream) {
          tracks.push(this.audioStream.getAudioTracks()[0])
        }

        // create new stream from video and audio

        this.outputStream = new MediaStream(tracks)

        // initialize mediarecorder

        this.recorder = new MediaRecorder(this.outputStream, options)

        // push data to buffer when data available
        this.recorder.addEventListener('dataavailable', (event) => {
          this.recordingChunks!.push(event.data)
        })

        // start recording
        this.recorder.start()

        // set plugin state to recording
        this.setPluginState({
          recording: true,
          status: 'recording',
        })
      })
      .catch((err) => {
        this.uppy.log(err, 'error')
        this.setPluginState({ screenRecError: err, status: 'error' })
      })
  }

  streamInactivated(): void {
    // get screen recorder state
    const { recordedVideo, recording } = { ...this.getPluginState() }

    if (!recordedVideo && !recording) {
      // Close the Dashboard panel if plugin is installed
      // into Dashboard (could be other parent UI plugin)
      // @ts-expect-error we can't know Dashboard types here
      if (this.parent?.hideAllPanels) {
        // @ts-expect-error we can't know Dashboard types here
        this.parent.hideAllPanels()
      }
      this.setPluginState({ status: 'init' })
    } else if (recording) {
      // stop recorder if it is active
      this.uppy.log('Capture stream inactive — stop recording')
      this.stopRecording()
    }

    this.videoStream = null
    this.audioStream = null

    this.setPluginState({
      streamActive: false,
      audioStreamActive: false,
    })
  }

  stopRecording(): Promise<void> {
    const stopped = new Promise<void>((resolve) => {
      this.recorder!.addEventListener('stop', () => {
        resolve()
      })

      this.recorder!.stop()
    })

    return stopped
      .then(() => {
        // recording stopped
        this.setPluginState({
          recording: false,
        })
        // get video file after recorder stopped
        return this.getVideo()
      })
      .then((file) => {
        // store media file
        this.capturedMediaFile = file

        // create object url for capture result preview
        this.setPluginState({
          recordedVideo: URL.createObjectURL(file.data),
          status: 'captured',
        })
      })
      .then(
        () => {
          this.recordingChunks = null
          this.recorder = null
        },
        (error) => {
          this.recordingChunks = null
          this.recorder = null
          throw error
        },
      )
  }

  discardRecordedMedia(): void {
    const { capturedScreenshotUrl, recordedVideo } = this.getPluginState()

    if (capturedScreenshotUrl) {
      URL.revokeObjectURL(capturedScreenshotUrl)
    }
    if (recordedVideo) {
      URL.revokeObjectURL(recordedVideo)
    }

    this.capturedMediaFile = null

    this.setPluginState({
      recordedVideo: null,
      capturedScreenshotUrl: null,
      status: this.getPluginState().streamActive ? 'ready' : 'init',
    })
  }

  submit(): void {
    try {
      // add recorded file to uppy
      if (this.capturedMediaFile) {
        this.uppy.addFile(this.capturedMediaFile)
      }
    } catch (err) {
      // Logging the error, exept restrictions, which is handled in Core
      if (!err.isRestriction) {
        this.uppy.log(err, 'warning')
      }
    }
  }

  stop(): void {
    // flush video stream
    if (this.videoStream) {
      this.videoStream.getVideoTracks().forEach((track) => {
        track.stop()
      })
      this.videoStream.getAudioTracks().forEach((track) => {
        track.stop()
      })
      this.videoStream = null
    }

    // flush audio stream
    if (this.audioStream) {
      this.audioStream.getAudioTracks().forEach((track) => {
        track.stop()
      })
      this.audioStream.getVideoTracks().forEach((track) => {
        track.stop()
      })
      this.audioStream = null
    }

    // flush output stream
    if (this.outputStream) {
      this.outputStream.getAudioTracks().forEach((track) => {
        track.stop()
      })
      this.outputStream.getVideoTracks().forEach((track) => {
        track.stop()
      })
      this.outputStream = null
    }

    // Clean up screenshot URL
    const { capturedScreenshotUrl, recordedVideo } = this.getPluginState()
    if (capturedScreenshotUrl) {
      URL.revokeObjectURL(capturedScreenshotUrl)
    }

    if (recordedVideo) {
      URL.revokeObjectURL(recordedVideo)
    }
    // remove preview video
    this.setPluginState({
      recording: false,
      streamActive: false,
      audioStreamActive: false,
      recordedVideo: null,
      capturedScreenshotUrl: null,
      status: 'init',
    })

    this.captureActive = false
  }

  getVideo(): Promise<{
    source: string
    name: string
    data: Blob
    type: string
  }> {
    const mimeType = this.recordingChunks![0].type
    const fileExtension = getFileTypeExtension(mimeType)

    if (!fileExtension) {
      return Promise.reject(
        new Error(
          `Could not retrieve recording: Unsupported media type "${mimeType}"`,
        ),
      )
    }

    const name = `screencap-${Date.now()}.${fileExtension}`
    const blob = new Blob(this.recordingChunks!, { type: mimeType })
    const file = {
      source: this.id,
      name,
      data: new Blob([blob], { type: mimeType }),
      type: mimeType,
    }

    return Promise.resolve(file)
  }

  async captureScreenshot(): Promise<void> {
    if (!this.mediaDevices?.getDisplayMedia) {
      throw new Error('Screen capture is not supported')
    }

    try {
      let stream = this.videoStream

      // Only request new stream if we don't have one
      if (!stream) {
        const newStream = await this.selectVideoStreamSource()
        if (!newStream) {
          throw new Error('Failed to get screen capture stream')
        }
        stream = newStream
      }

      const video = document.createElement('video')
      video.srcObject = stream

      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play()
          resolve(null)
        }
      })

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Validate and set fallback for preferred image mime type
      let mimeType = this.opts.preferredImageMimeType
      if (!mimeType || !SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
        this.uppy.log(
          `Unsupported image type "${mimeType}", falling back to image/png`,
          'warning',
        )
        mimeType = 'image/png'
      }

      const quality = 1

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create screenshot blob'))
              return
            }

            const fileExtension = getFileTypeExtension(mimeType) || 'png'
            const file = {
              source: this.id,
              name: `Screenshot ${new Date().toISOString()}.${fileExtension}`,
              type: mimeType,
              data: blob,
            }

            try {
              this.capturedMediaFile = file
              const screenshotUrl = URL.createObjectURL(blob)
              this.setPluginState({
                capturedScreenshotUrl: screenshotUrl,
                status: 'captured',
              })
              resolve()
            } catch (err) {
              if (this.getPluginState().capturedScreenshotUrl) {
                this.setPluginState({ capturedScreenshotUrl: null })
              }
              if (!err.isRestriction) {
                this.uppy.log(err, 'error')
              }
              reject(err)
            } finally {
              // Cleanup
              video.srcObject = null
              canvas.remove()
              video.remove()
            }
          },
          mimeType,
          quality,
        )
      })
    } catch (err) {
      this.uppy.log(err, 'error')
      throw err
    }
  }

  render(): ComponentChild {
    // get screen recorder state
    const recorderState = this.getPluginState()

    if (
      !recorderState.streamActive &&
      !this.captureActive &&
      !this.userDenied
    ) {
      this.start()
    }

    return (
      <RecorderScreen<M, B>
        {...recorderState}
        onStartRecording={this.startRecording}
        onStopRecording={this.stopRecording}
        enableScreenshots={this.opts.enableScreenshots}
        onScreenshot={this.captureScreenshot}
        onStop={this.stop}
        onSubmit={this.submit}
        i18n={this.i18n}
        stream={this.videoStream}
        onDiscard={this.discardRecordedMedia}
      />
    )
  }
}
