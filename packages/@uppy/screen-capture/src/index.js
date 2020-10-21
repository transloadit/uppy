const { h } = require('preact')
const { Plugin } = require('@uppy/core')
const Translator = require('@uppy/utils/lib/Translator')
const getFileTypeExtension = require('@uppy/utils/lib/getFileTypeExtension')
const ScreenRecIcon = require('./ScreenRecIcon')
const CaptureScreen = require('./CaptureScreen')

// Adapted from: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
function getMediaDevices () {
  // check if screen capturing is supported
  /* eslint-disable */
  if (navigator &&
    navigator.mediaDevices &&
    navigator.mediaDevices.getDisplayMedia &&
    window &&
    window.MediaRecorder) {
    return navigator.mediaDevices
  }
  /* eslint-enable */

  return null
}

/**
 * Screen capture
 */
module.exports = class ScreenCapture extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.mediaDevices = getMediaDevices()
    this.protocol = location.protocol.match(/https/i) ? 'https' : 'http'
    this.id = this.opts.id || 'ScreenCapture'
    this.title = this.opts.title || 'Screencast'
    this.type = 'acquirer'
    this.icon = ScreenRecIcon

    this.defaultLocale = {
      strings: {
        startCapturing: 'Begin screen capturing',
        stopCapturing: 'Stop screen capturing',
        submitRecordedFile: 'Submit captured video',
        streamActive: 'Stream active',
        streamPassive: 'Stream passive',
        micDisabled: 'Microphone access denied by user',
        recording: 'Recording'
      }
    }

    // set default options
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamConstraints
    const defaultOptions = {
      // https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints#Properties_of_shared_screen_tracks
      displayMediaConstraints: {
        video: {
          width: 1280,
          height: 720,
          frameRate: {
            ideal: 3,
            max: 5
          },
          cursor: 'motion',
          displaySurface: 'monitor'
        }
      },
      // https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamConstraints/audio
      userMediaConstraints: {
        audio: true
      },
      preferredVideoMimeType: 'video/webm'
    }

    // merge default options with the ones set by user
    this.opts = { ...defaultOptions, ...opts }

    // i18n
    this.translator = new Translator([this.defaultLocale, this.uppy.locale, this.opts.locale])
    this.i18n = this.translator.translate.bind(this.translator)
    this.i18nArray = this.translator.translateArray.bind(this.translator)

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

  install () {
    // Return if browser doesn’t support getDisplayMedia and
    if (!this.mediaDevices) {
      this.uppy.log('Screen recorder access is not supported', 'error')
      return null
    }

    this.setPluginState({
      streamActive: false,
      audioStreamActive: false
    })

    const target = this.opts.target
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall () {
    if (this.videoStream) {
      this.stop()
    }

    this.unmount()
  }

  start () {
    if (!this.mediaDevices) {
      return Promise.reject(new Error('Screen recorder access not supported'))
    }

    this.captureActive = true

    this.selectAudioStreamSource()

    this.selectVideoStreamSource()
      .then(res => {
        // something happened in start -> return
        if (res === false) {
          // Close the Dashboard panel if plugin is installed
          // into Dashboard (could be other parent UI plugin)
          if (this.parent && this.parent.hideAllPanels) {
            this.parent.hideAllPanels()
            this.captureActive = false
          }
        }
      })
  }

  selectVideoStreamSource () {
    // if active stream available, return it
    if (this.videoStream) {
      return new Promise(resolve => resolve(this.videoStream))
    }

    // ask user to select source to record and get mediastream from that
    // eslint-disable-next-line compat/compat
    return this.mediaDevices.getDisplayMedia(this.opts.displayMediaConstraints)
      .then((videoStream) => {
        this.videoStream = videoStream

        // add event listener to stop recording if stream is interrupted
        this.videoStream.addEventListener('inactive', (event) => {
          this.streamInactivated()
        })

        this.setPluginState({
          streamActive: true
        })

        return videoStream
      })
      .catch((err) => {
        this.setPluginState({
          screenRecError: err
        })

        this.userDenied = true

        setTimeout(() => {
          this.userDenied = false
        }, 1000)

        return false
      })
  }

  selectAudioStreamSource () {
    // if active stream available, return it
    if (this.audioStream) {
      return new Promise(resolve => resolve(this.audioStream))
    }

    // ask user to select source to record and get mediastream from that
    // eslint-disable-next-line compat/compat
    return this.mediaDevices.getUserMedia(this.opts.userMediaConstraints)
      .then((audioStream) => {
        this.audioStream = audioStream

        this.setPluginState({
          audioStreamActive: true
        })

        return audioStream
      })
      .catch((err) => {
        if (err.name === 'NotAllowedError') {
          this.uppy.info(this.i18n('micDisabled'), 'error', 5000)
        }

        return false
      })
  }

  startRecording () {
    const options = {}
    this.capturedMediaFile = null
    this.recordingChunks = []
    const preferredVideoMimeType = this.opts.preferredVideoMimeType

    this.selectVideoStreamSource()
      .then((videoStream) => {
        // Attempt to use the passed preferredVideoMimeType (if any) during recording.
        // If the browser doesn't support it, we'll fall back to the browser default instead
        if (preferredVideoMimeType && MediaRecorder.isTypeSupported(preferredVideoMimeType) && getFileTypeExtension(preferredVideoMimeType)) {
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
          this.recordingChunks.push(event.data)
        })

        // start recording
        this.recorder.start()

        // set plugin state to recording
        this.setPluginState({
          recording: true
        })
      })
      .catch((err) => {
        this.uppy.log(err, 'error')
      })
  }

  streamInactivated () {
    // get screen recorder state
    const { recordedVideo, recording } = { ...this.getPluginState() }

    if (!recordedVideo && !recording) {
      // Close the Dashboard panel if plugin is installed
      // into Dashboard (could be other parent UI plugin)
      if (this.parent && this.parent.hideAllPanels) {
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
      streamActive: false, audioStreamActive: false
    })
  }

  stopRecording () {
    const stopped = new Promise((resolve, reject) => {
      this.recorder.addEventListener('stop', () => {
        resolve()
      })

      this.recorder.stop()
    })

    return stopped.then(() => {
      // recording stopped
      this.setPluginState({
        recording: false
      })
      // get video file after recorder stopped
      return this.getVideo()
    }).then((file) => {
      // store media file
      this.capturedMediaFile = file

      // create object url for capture result preview
      this.setPluginState({
        // eslint-disable-next-line compat/compat
        recordedVideo: URL.createObjectURL(file.data)
      })
    }).then(() => {
      this.recordingChunks = null
      this.recorder = null
    }, (error) => {
      this.recordingChunks = null
      this.recorder = null
      throw error
    })
  }

  submit () {
    try {
      // add recorded file to uppy
      if (this.capturedMediaFile) {
        this.uppy.addFile(this.capturedMediaFile)
      }
    } catch (err) {
      // Logging the error, exept restrictions, which is handled in Core
      if (!err.isRestriction) {
        this.uppy.log(err, 'error')
      }
    }
  }

  stop () {
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
      recordedVideo: null
    })

    this.captureActive = false
  }

  getVideo () {
    const mimeType = this.recordingChunks[0].type
    const fileExtension = getFileTypeExtension(mimeType)

    if (!fileExtension) {
      return Promise.reject(new Error(`Could not retrieve recording: Unsupported media type "${mimeType}"`))
    }

    const name = `screencap-${Date.now()}.${fileExtension}`
    const blob = new Blob(this.recordingChunks, { type: mimeType })
    const file = {
      source: this.id,
      name: name,
      data: new Blob([blob], { type: mimeType }),
      type: mimeType
    }

    return Promise.resolve(file)
  }

  render (state) {
    // get screen recorder state
    const recorderState = this.getPluginState()

    if (!recorderState.streamActive && !this.captureActive && !this.userDenied) {
      this.start()
    }

    return (
      <CaptureScreen
        {...recorderState}
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
