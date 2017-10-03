const Plugin = require('../Plugin')
const WebcamProvider = require('../../uppy-base/src/plugins/Webcam')
const Translator = require('../../core/Translator')
const { getFileTypeExtension } = require('../../core/Utils')
const supportsMediaRecorder = require('./supportsMediaRecorder')
const WebcamIcon = require('./WebcamIcon')
const CameraScreen = require('./CameraScreen')
const PermissionsScreen = require('./PermissionsScreen')

/**
 * Webcam
 */
module.exports = class Webcam extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.userMedia = true
    this.protocol = location.protocol.match(/https/i) ? 'https' : 'http'
    this.type = 'acquirer'
    this.id = 'Webcam'
    this.title = 'Webcam'
    this.icon = WebcamIcon
    this.focus = this.focus.bind(this)

    const defaultLocale = {
      strings: {
        smile: 'Smile!'
      }
    }

    // set default options
    const defaultOptions = {
      onBeforeSnapshot: () => Promise.resolve(),
      countdown: false,
      locale: defaultLocale,
      modes: [
        'video-audio',
        'video-only',
        'audio-only',
        'picture'
      ]
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.locale = Object.assign({}, defaultLocale, this.opts.locale)
    this.locale.strings = Object.assign({}, defaultLocale.strings, this.opts.locale.strings)

    // i18n
    this.translator = new Translator({locale: this.locale})
    this.i18n = this.translator.translate.bind(this.translator)

    this.install = this.install.bind(this)
    this.setPluginState = this.setPluginState.bind(this)

    this.render = this.render.bind(this)

    // Camera controls
    this.start = this.start.bind(this)
    this.stop = this.stop.bind(this)
    this.takeSnapshot = this.takeSnapshot.bind(this)
    this.startRecording = this.startRecording.bind(this)
    this.stopRecording = this.stopRecording.bind(this)
    this.oneTwoThreeSmile = this.oneTwoThreeSmile.bind(this)
    // this.justSmile = this.justSmile.bind(this)

    this.webcam = new WebcamProvider(this.opts)
    this.webcamActive = false

    if (this.opts.countdown) {
      this.opts.onBeforeSnapshot = this.oneTwoThreeSmile
    }
  }

  start () {
    this.webcamActive = true

    this.webcam.start()
      .then((stream) => {
        this.stream = stream
        this.setPluginState({
          // videoStream: stream,
          cameraReady: true
        })
      })
      .catch((err) => {
        this.setPluginState({
          cameraError: err
        })
      })
  }

  startRecording () {
    // TODO We can check here if any of the mime types listed in the
    // mimeToExtensions map in Utils.js are supported, and prefer to use one of
    // those.
    // Right now we let the browser pick a type that it deems appropriate.
    this.recorder = new MediaRecorder(this.stream)
    this.recordingChunks = []
    this.recorder.addEventListener('dataavailable', (event) => {
      this.recordingChunks.push(event.data)
    })
    this.recorder.start()

    this.setPluginState({
      isRecording: true
    })
  }

  stopRecording () {
    return new Promise((resolve, reject) => {
      this.recorder.addEventListener('stop', () => {
        this.setPluginState({
          isRecording: false
        })

        const mimeType = this.recordingChunks[0].type
        const fileExtension = getFileTypeExtension(mimeType)

        if (!fileExtension) {
          reject(new Error(`Could not upload file: Unsupported media type "${mimeType}"`))
          return
        }

        const file = {
          source: this.id,
          name: `webcam-${Date.now()}.${fileExtension}`,
          type: mimeType,
          data: new Blob(this.recordingChunks, { type: mimeType })
        }

        this.core.addFile(file)

        this.recordingChunks = null
        this.recorder = null

        resolve()
      })

      this.recorder.stop()
    })
  }

  stop () {
    this.stream.getAudioTracks().forEach((track) => {
      track.stop()
    })
    this.stream.getVideoTracks().forEach((track) => {
      track.stop()
    })
    this.webcamActive = false
    this.stream = null
    this.streamSrc = null
  }

  oneTwoThreeSmile () {
    return new Promise((resolve, reject) => {
      let count = this.opts.countdown

      let countDown = setInterval(() => {
        if (!this.webcamActive) {
          clearInterval(countDown)
          this.captureInProgress = false
          return reject(new Error('Webcam is not active'))
        }

        if (count > 0) {
          this.core.info(`${count}...`, 'warning', 800)
          count--
        } else {
          clearInterval(countDown)
          this.core.info(this.i18n('smile'), 'success', 1500)
          setTimeout(() => resolve(), 1500)
        }
      }, 1000)
    })
  }

  // justSmile () {
  //   return new Promise((resolve, reject) => {
  //     setTimeout(() => this.core.info(this.i18n('smile'), 'success', 1000), 1500)
  //     setTimeout(() => resolve(), 2000)
  //   })
  // }

  takeSnapshot () {
    const opts = {
      name: `webcam-${Date.now()}.jpg`,
      mimeType: 'image/jpeg'
    }

    this.videoEl = this.target.querySelector('.UppyWebcam-video')

    if (this.captureInProgress) return
    this.captureInProgress = true

    this.opts.onBeforeSnapshot().catch((err) => {
      const message = typeof err === 'object' ? err.message : err
      this.core.info(message, 'error', 5000)
      return Promise.reject(new Error(`onBeforeSnapshot: ${message}`))
    }).then(() => {
      const video = this.target.querySelector('.UppyWebcam-video')
      if (!video) {
        this.captureInProgress = false
        return Promise.reject(new Error('No video element found, likely due to the Webcam tab being closed.'))
      }

      const image = this.webcam.getImage(video, opts)

      const tagFile = {
        source: this.id,
        name: opts.name,
        data: image.data,
        type: opts.mimeType
      }

      this.captureInProgress = false
      this.core.addFile(tagFile)
    })
  }

  focus () {
    if (this.opts.countdown) return
    setTimeout(() => {
      this.core.info(this.i18n('smile'), 'success', 1500)
    }, 1000)
  }

  render (state) {
    if (!this.webcamActive) {
      this.start()
    }

    const webcamState = this.getPluginState()

    if (!webcamState.cameraReady) {
      return PermissionsScreen(webcamState)
    }

    if (!this.streamSrc) {
      this.streamSrc = this.stream ? URL.createObjectURL(this.stream) : null
    }

    return CameraScreen(Object.assign({}, webcamState, {
      onSnapshot: this.takeSnapshot,
      onStartRecording: this.startRecording,
      onStopRecording: this.stopRecording,
      onFocus: this.focus,
      onStop: this.stop,
      modes: this.opts.modes,
      supportsRecording: supportsMediaRecorder(),
      recording: webcamState.isRecording,
      src: this.streamSrc
    }))
  }

  install () {
    this.webcam.init()
    this.setPluginState({
      cameraReady: false
    })

    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)
  }

  uninstall () {
    this.webcam.reset()
    this.unmount()
  }
}
