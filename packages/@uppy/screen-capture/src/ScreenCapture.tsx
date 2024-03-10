import { h, type ComponentChild } from 'preact'
import { UIPlugin, Uppy, type UIPluginOptions } from '@uppy/core'
import getFileTypeExtension from '@uppy/utils/lib/getFileTypeExtension'
import type { DefinePluginOpts } from '@uppy/core/lib/BasePlugin.ts'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import ScreenRecIcon from './ScreenRecIcon.tsx'
import RecorderScreen from './RecorderScreen.tsx'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../package.json'
import locale from './locale.ts'

// Check if screen capturing is supported.
// mediaDevices is supprted on mobile Safari, getDisplayMedia is not
function isScreenRecordingSupported() {
  return window.MediaRecorder && navigator.mediaDevices?.getDisplayMedia // eslint-disable-line compat/compat
}

// Adapted from: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
function getMediaDevices() {
  return window.MediaRecorder && navigator.mediaDevices // eslint-disable-line compat/compat
}

export interface ScreenCaptureOptions extends UIPluginOptions {
  title?: string
  displayMediaConstraints?: MediaStreamConstraints
  userMediaConstraints?: MediaStreamConstraints
  preferredVideoMimeType?: string
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
}

type Opts = DefinePluginOpts<ScreenCaptureOptions, keyof typeof defaultOptions>

export type ScreenCaptureState = {
  streamActive: boolean
  audioStreamActive: boolean
  recording: boolean
  recordedVideo: string | null
  screenRecError: string | null
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

  videoStream: null | MediaStream

  audioStream: null | MediaStream

  userDenied: boolean

  recorder: null | MediaRecorder

  outputStream: null | MediaStream

  recordingChunks: Blob[] | null

  constructor(uppy: Uppy<M, B>, opts?: ScreenCaptureOptions) {
    super(uppy, { ...defaultOptions, ...opts })
    this.mediaDevices = getMediaDevices()
    // eslint-disable-next-line no-restricted-globals
    this.protocol = location.protocol === 'https:' ? 'https' : 'http'
    this.id = this.opts.id || 'ScreenCapture'
    this.title = this.opts.title || 'Screencast'
    this.type = 'acquirer'
    this.icon = ScreenRecIcon

    this.defaultLocale = locale

    // i18n
    this.i18nInit()

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

    // initialize
    this.captureActive = false
    this.capturedMediaFile = null
  }

  install(): null | undefined {
    if (!isScreenRecordingSupported()) {
      this.uppy.log('Screen recorder access is not supported', 'warning')
      return null
    }

    this.setPluginState({
      streamActive: false,
      audioStreamActive: false,
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
        if (this.parent && this.parent.hideAllPanels) {
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
    // eslint-disable-next-line compat/compat
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
        })

        return videoStream
      })
      .catch((err) => {
        this.setPluginState({
          screenRecError: err,
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
    // eslint-disable-next-line compat/compat
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
        // eslint-disable-next-line compat/compat
        this.outputStream = new MediaStream(tracks)

        // initialize mediarecorder
        // eslint-disable-next-line compat/compat
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
        })
      })
      .catch((err) => {
        this.uppy.log(err, 'error')
      })
  }

  streamInactivated(): void {
    // get screen recorder state
    const { recordedVideo, recording } = { ...this.getPluginState() }

    if (!recordedVideo && !recording) {
      // Close the Dashboard panel if plugin is installed
      // into Dashboard (could be other parent UI plugin)
      // @ts-expect-error we can't know Dashboard types here
      if (this.parent && this.parent.hideAllPanels) {
        // @ts-expect-error we can't know Dashboard types here
        this.parent.hideAllPanels()
      }
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
          // eslint-disable-next-line compat/compat
          recordedVideo: URL.createObjectURL(file.data),
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

    // remove preview video
    this.setPluginState({
      recordedVideo: null,
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
        {...recorderState} // eslint-disable-line react/jsx-props-no-spreading
        onStartRecording={this.startRecording}
        onStopRecording={this.stopRecording}
        onStop={this.stop}
        onSubmit={this.submit}
        i18n={this.i18n}
        stream={this.videoStream}
      />
    )
  }
}
