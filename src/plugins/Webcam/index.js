const Plugin = require('../Plugin')
const WebcamProvider = require('../../uppy-base/src/plugins/Webcam')
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

    // set default options
    const defaultOptions = {
      enableFlash: true,
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

    this.install = this.install.bind(this)
    this.updateState = this.updateState.bind(this)

    this.render = this.render.bind(this)

    // Camera controls
    this.start = this.start.bind(this)
    this.stop = this.stop.bind(this)
    this.takeSnapshot = this.takeSnapshot.bind(this)
    this.startRecording = this.startRecording.bind(this)
    this.stopRecording = this.stopRecording.bind(this)

    this.webcam = new WebcamProvider(this.opts, this.params)
    this.webcamActive = false
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

  takeSnapshot () {
    const opts = {
      name: `webcam-${Date.now()}.jpg`,
      mimeType: 'image/jpeg'
    }

    const video = this.target.querySelector('.UppyWebcam-video')

    const image = this.webcam.getImage(video, opts)

    const tagFile = {
      source: this.id,
      name: opts.name,
      data: image.data,
      type: opts.mimeType
    }

    this.core.emitter.emit('core:file-add', tagFile)
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

  focus () {
    setTimeout(() => {
      this.core.emitter.emit('informer', 'Smile!', 'warning', 2000)
    }, 1000)
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

  /**
   * Little shorthand to update the state with my new state
   */
  updateState (newState) {
    const {state} = this.core
    const webcam = Object.assign({}, state.webcam, newState)

    this.core.setState({webcam})
  }
}
