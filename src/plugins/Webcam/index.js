const Plugin = require('../Plugin')
const Translator = require('../../core/Translator')
const {
  getFileTypeExtension,
  canvasToBlob
} = require('../../core/Utils')
const supportsMediaRecorder = require('./supportsMediaRecorder')
const WebcamIcon = require('./WebcamIcon')
const CameraScreen = require('./CameraScreen')
const PermissionsScreen = require('./PermissionsScreen')

// Setup getUserMedia, with polyfill for older browsers
// Adapted from: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
function getMediaDevices () {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return navigator.mediaDevices
  }

  const getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia
  if (!getUserMedia) {
    return null
  }

  return {
    getUserMedia (opts) {
      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, opts, resolve, reject)
      })
    }
  }
}

/**
 * Webcam
 */
module.exports = class Webcam extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.mediaDevices = getMediaDevices()
    this.supportsUserMedia = !!this.mediaDevices
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

    this.webcamActive = false

    if (this.opts.countdown) {
      this.opts.onBeforeSnapshot = this.oneTwoThreeSmile
    }
  }

  isSupported () {
    return !!this.mediaDevices
  }

  getConstraints () {
    const acceptsAudio = this.opts.modes.indexOf('video-audio') !== -1 ||
      this.opts.modes.indexOf('audio-only') !== -1
    const acceptsVideo = this.opts.modes.indexOf('video-audio') !== -1 ||
      this.opts.modes.indexOf('video-only') !== -1 ||
      this.opts.modes.indexOf('picture') !== -1

    return {
      audio: acceptsAudio,
      video: acceptsVideo
    }
  }

  start () {
    if (!this.isSupported()) {
      return Promise.reject(new Error('Webcam access not supported'))
    }

    this.webcamActive = true

    const constraints = this.getConstraints()

    // ask user for access to their camera
    return this.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        this.stream = stream
        this.streamSrc = URL.createObjectURL(this.stream)
        this.setPluginState({
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
    const stopped = new Promise((resolve, reject) => {
      this.recorder.addEventListener('stop', () => {
        resolve()
      })
      this.recorder.stop()
    })

    return stopped.then(() => {
      this.setPluginState({
        isRecording: false
      })
      return this.getVideo()
    }).then((file) => {
      return this.core.addFile(file)
    }).then(() => {
      this.recordingChunks = null
      this.recorder = null
    }, (error) => {
      this.recordingChunks = null
      this.recorder = null
      throw error
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

  getVideoElement () {
    return this.target.querySelector('.UppyWebcam-video')
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

  takeSnapshot () {
    if (this.captureInProgress) return
    this.captureInProgress = true

    this.opts.onBeforeSnapshot().catch((err) => {
      const message = typeof err === 'object' ? err.message : err
      this.core.info(message, 'error', 5000)
      return Promise.reject(new Error(`onBeforeSnapshot: ${message}`))
    }).then(() => {
      return this.getImage()
    }).then((tagFile) => {
      this.captureInProgress = false
      this.core.addFile(tagFile)
    }, (error) => {
      this.captureInProgress = false
      throw error
    })
  }

  getImage () {
    const video = this.getVideoElement()
    if (!video) {
      return Promise.reject(new Error('No video element found, likely due to the Webcam tab being closed.'))
    }

    const name = `webcam-${Date.now()}.jpg`
    const mimeType = 'image/jpeg'

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)

    return canvasToBlob(canvas, mimeType).then((blob) => {
      return {
        source: this.id,
        name: name,
        data: new File([blob], name, { type: mimeType }),
        type: mimeType
      }
    })
  }

  getVideo () {
    const mimeType = this.recordingChunks[0].type
    const fileExtension = getFileTypeExtension(mimeType)

    if (!fileExtension) {
      return Promise.reject(new Error(`Could not retrieve recording: Unsupported media type "${mimeType}"`))
    }

    const name = `webcam-${Date.now()}.${fileExtension}`
    const blob = new Blob(this.recordingChunks, { type: mimeType })
    const file = {
      source: this.id,
      name: name,
      data: new File([blob], name, { type: mimeType }),
      type: mimeType
    }

    return Promise.resolve(file)
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
    this.setPluginState({
      cameraReady: false
    })

    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)
  }

  uninstall () {
    if (this.stream) {
      this.stop()
    }

    this.unmount()
  }
}
