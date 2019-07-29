const { h } = require('preact')
const { Plugin } = require('@uppy/core')
const Translator = require('@uppy/utils/lib/Translator')
const getFileTypeExtension = require('@uppy/utils/lib/getFileTypeExtension')
const ScreenRecIcon = require('./ScreenRecIcon')
const CaptureScreen = require('./CaptureScreen')

// Setup getUserMedia, with polyfill for older browsers
// Adapted from: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
function checkDisplayMediaSupport () {
  // check if screen capturing is supported
  // eslint-disable-next-line compat/compat
  if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
    // eslint-disable-next-line compat/compat
    return navigator.mediaDevices.getDisplayMedia
  } else {
    console.log('Screencapturing is not supported')
    return null
  }
}

/**
 * Screen capture
 */
module.exports = class ScreenCapture extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.displayMediaObject = checkDisplayMediaSupport()
    this.protocol = location.protocol.match(/https/i) ? 'https' : 'http'
    this.id = this.opts.id || 'ScreenCapture'
    this.title = this.opts.title || 'Capture'
    this.type = 'acquirer'
    this.icon = ScreenRecIcon

    this.defaultLocale = {
      strings: {
        startCapturing: 'Begin screen capturing',
        stopCapturing: 'Stop screen capturing',
        selectSourceTitle: 'Please allow access to your screen',
        selectSourceDescription: 'In order to capture your screen, please allow access for this site.',
        submitRecordedFile: 'Submit captured video',
        streamActive: 'Stream active',
        streamPassive: 'Stream passive'
      }
    }

    // set default options
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamConstraints
    const defaultOptions = {
      displayMediaConstraints: {
        video: {
          width: 1280,
          height: 720,
          frameRate: {
            ideal: 3,
            max: 5
          }
        },
        cursor: 'motion',
        displaySurface: 'monitor'
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

    this.debug = true
  }

  // install plugin. https://uppy.io/docs/writing-plugins/#install
  install () {
    // return if browser doesn't support getDisplayMedia
    if (!this.displayMediaObject) {
      return null
    }

    this.setPluginState({
      streamActive: false
    })

    const target = this.opts.target
    if (target) {
      // mount to target (css, dom, another plugin). https://uppy.io/docs/writing-plugins/#mount-target
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
    if (!this.displayMediaObject) {
      return Promise.reject(new Error('Screen recorder access not supported'))
    }

    this.captureActive = true

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
    return navigator.mediaDevices.getDisplayMedia(this.opts.displayMediaConstraints)
      .then((videoStream) => {
        this.videoStream = videoStream

        // add event listener to stop recording if stream is interrupted
        this.videoStream.addEventListener('inactive', (event) => {
          this.streamInactivated()
        })

        this.setPluginState({
          streamActive: true
        })

        if (this.debug) console.log('stream selected')

        return videoStream
      })
      .catch((err) => {
        this.setPluginState({
          screenRecError: err
        })

        this.userDenied = true

        // console.log('user denied stream access')

        setTimeout(() => {
          this.userDenied = false
        }, 1000)

        return false
      })
  }

  startRecording () {
    let options = {}
    this.capturedMediaFile = null
    this.recordingChunks = []
    const preferredVideoMimeType = this.opts.preferredVideoMimeType

    this.selectVideoStreamSource()
      .then((stream) => {
        // Attempt to use the passed preferredVideoMimeType (if any) during recording.
        // If the browser doesn't support it, we'll fall back to the browser default instead
        if (preferredVideoMimeType && MediaRecorder.isTypeSupported(preferredVideoMimeType) && getFileTypeExtension(preferredVideoMimeType)) {
          options.mimeType = preferredVideoMimeType
        }

        // initialize mediarecorder
        this.recorder = new MediaRecorder(stream, options)

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
        console.log(err)
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
      console.log('Capture stream inactive - stop recording!')
      this.stopRecording()
    } else {
      // do something...
    }

    this.videoStream = null

    this.setPluginState({
      streamActive: false
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
        recordedVideo: URL.createObjectURL(file.data)
      })
    }).then(() => {
      this.recordingChunks = null
      this.recorder = null

      // Close the Dashboard panel if plugin is installed
      // into Dashboard (could be other parent UI plugin)
      // if (this.parent && this.parent.hideAllPanels) {
      //   this.parent.hideAllPanels()
      // }
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
        this.uppy.log(err)
      }
    }
  }

  stop () {
    // flush the stream
    if (this.videoStream) {
      this.videoStream.getAudioTracks().forEach((track) => {
        track.stop()
      })
      this.videoStream.getVideoTracks().forEach((track) => {
        track.stop()
      })
      this.videoStream = null
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
    console.log(recorderState)

    if (!recorderState.streamActive && !this.captureActive && !this.userDenied) {
      this.start()
    }

    return <CaptureScreen
      {...recorderState}
      onStartRecording={this.startRecording}
      onStopRecording={this.stopRecording}
      onStop={this.stop}
      onSubmit={this.submit}
      i18n={this.i18n}
      stream={this.videoStream} />
  }
}
