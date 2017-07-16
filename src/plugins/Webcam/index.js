const Plugin = require('../Plugin')
const WebcamProvider = require('../../uppy-base/src/plugins/Webcam')
const Translator = require('../../core/Translator')
const { extend,
        getFileTypeExtension,
        supportsMediaRecorder } = require('../../core/Utils')
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
      enableFlash: true,
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

    this.params = {
      swfURL: 'webcam.swf',
      width: 400,
      height: 300,
      dest_width: 800,         // size of captured image
      dest_height: 600,        // these default to width/height
      image_format: 'jpeg',  // image format (may be jpeg or png)
      jpeg_quality: 90,      // jpeg image quality from 0 (worst) to 100 (best)
      enable_flash: true,    // enable flash fallback,
      force_flash: false,    // force flash mode,
      flip_horiz: false,     // flip image horiz (mirror mode)
      fps: 30,               // camera frames per second
      upload_name: 'webcam', // name of file in upload post data
      constraints: null,     // custom user media constraints,
      flashNotDetectedText: 'ERROR: No Adobe Flash Player detected.  Webcam.js relies on Flash for browsers that do not support getUserMedia (like yours).',
      noInterfaceFoundText: 'No supported webcam interface found.',
      unfreeze_snap: true    // Whether to unfreeze the camera after snap (defaults to true)
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.locale = Object.assign({}, defaultLocale, this.opts.locale)
    this.locale.strings = Object.assign({}, defaultLocale.strings, this.opts.locale.strings)

    // i18n
    this.translator = new Translator({locale: this.locale})
    this.i18n = this.translator.translate.bind(this.translator)

    this.install = this.install.bind(this)
    this.updateState = this.updateState.bind(this)

    this.render = this.render.bind(this)

    // Camera controls
    this.start = this.start.bind(this)
    this.stop = this.stop.bind(this)
    this.takeSnapshot = this.takeSnapshot.bind(this)
    this.startRecording = this.startRecording.bind(this)
    this.stopRecording = this.stopRecording.bind(this)
    this.oneTwoThreeSmile = this.oneTwoThreeSmile.bind(this)
    // this.justSmile = this.justSmile.bind(this)

    this.webcam = new WebcamProvider(this.opts, this.params)
    this.webcamActive = false

    if (this.opts.countdown) {
      this.opts.onBeforeSnapshot = this.oneTwoThreeSmile
    }

    // if (typeof opts.onBeforeSnapshot === 'undefined' || !this.opts.onBeforeSnapshot) {
    //   if (this.opts.countdown) {
    //     this.opts.onBeforeSnapshot = this.oneTwoThreeSmile
    //   } else {
    //     this.opts.onBeforeSnapshot = this.justSmile
    //   }
    // }
  }

  /**
   * Little shorthand to update the state with my new state
   */
  updateState (newState) {
    const {state} = this.core
    const webcam = Object.assign({}, state.webcam, newState)

    this.core.setState({webcam})
  }

  start () {
    this.webcamActive = true

    this.webcam.start()
      .then((stream) => {
        this.stream = stream
        this.updateState({
          // videoStream: stream,
          cameraReady: true
        })
      })
      .catch((err) => {
        this.updateState({
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

    this.updateState({
      isRecording: true
    })
  }

  stopRecording () {
    return new Promise((resolve, reject) => {
      this.recorder.addEventListener('stop', () => {
        this.updateState({
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

        this.core.emitter.emit('core:file-add', file)

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
          return reject('Webcam is not active')
        }

        if (count > 0) {
          this.core.emit('informer', `${count}...`, 'warning', 800)
          count--
        } else {
          clearInterval(countDown)
          this.core.emit('informer', this.i18n('smile'), 'success', 1500)
          setTimeout(() => resolve(), 1500)
        }
      }, 1000)
    })
  }

  // justSmile () {
  //   return new Promise((resolve, reject) => {
  //     setTimeout(() => this.core.emit('informer', this.i18n('smile'), 'success', 1000), 1500)
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
      this.emit('informer', err, 'error', 5000)
      return Promise.reject(`onBeforeSnapshot: ${err}`)
    }).then(() => {
      const video = this.target.querySelector('.UppyWebcam-video')
      if (!video) {
        this.captureInProgress = false
        return Promise.reject('No video element found, likely due to the Webcam tab being closed.')
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
      this.core.emit('informer', this.i18n('smile'), 'success', 1500)
    }, 1000)
  }

  render (state) {
    if (!this.webcamActive) {
      this.start()
    }

    if (!state.webcam.cameraReady && !state.webcam.useTheFlash) {
      return PermissionsScreen(state.webcam)
    }

    if (!this.streamSrc) {
      this.streamSrc = this.stream ? URL.createObjectURL(this.stream) : null
    }

    return CameraScreen(extend(state.webcam, {
      onSnapshot: this.takeSnapshot,
      onStartRecording: this.startRecording,
      onStopRecording: this.stopRecording,
      onFocus: this.focus,
      onStop: this.stop,
      modes: this.opts.modes,
      supportsRecording: supportsMediaRecorder(),
      recording: state.webcam.isRecording,
      getSWFHTML: this.webcam.getSWFHTML,
      src: this.streamSrc
    }))
  }

  install () {
    this.webcam.init()
    this.core.setState({
      webcam: {
        cameraReady: false
      }
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
