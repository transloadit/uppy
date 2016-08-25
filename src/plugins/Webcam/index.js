import Plugin from '../Plugin'
import {extend, dataURItoFile} from '../../core/Utils'
import CameraScreen from './CameraScreen'
import PermissionsScreen from './PermissionsScreen'
import WebcamIcon from './WebcamIcon'
import html from '../../core/html'
var _userMedia

/**
 * Webcam
 */
export default class Webcam extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.userMedia = true
    this.protocol = location.protocol.match(/https/i) ? 'https' : 'http'
    this.init()
    this.type = 'acquirer'
    this.id = 'Webcam'
    this.title = 'Webcam'
    this.icon = WebcamIcon()

    // set default options
    const defaultOptions = {
      enableFlash: true
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
    this.init = this.init.bind(this)
    this.stopWebcam = this.stopWebcam.bind(this)
    this.startRecording = this.startRecording.bind(this)
    this.stopRecording = this.stopRecording.bind(this)
    this.takeSnapshot = this.takeSnapshot.bind(this)
    this.generateImage = this.generateImage.bind(this)
    this.getSWFHTML = this.getSWFHTML.bind(this)
    this.detectFlash = this.detectFlash.bind(this)
  }

  /**
   * Checks for getUserMedia support
   */
  init () {
    // initialize, check for getUserMedia support

    // Setup getUserMedia, with polyfill for older browsers
    // Adapted from: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    this.mediaDevices = (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      ? navigator.mediaDevices : ((navigator.mozGetUserMedia || navigator.webkitGetUserMedia) ? {
        getUserMedia: function (c) {
          return new Promise(function (resolve, reject) {
            (navigator.mozGetUserMedia ||
            navigator.webkitGetUserMedia).call(navigator, c, resolve, reject)
          })
        }
      } : null)

    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL
    this.userMedia = this.userMedia && !!this.mediaDevices && !!window.URL

    // Older versions of firefox (< 21) apparently claim support but user media does not actually work
    if (navigator.userAgent.match(/Firefox\D+(\d+)/)) {
      if (parseInt(RegExp.$1, 10) < 21) this.userMedia = null
    }

    // Make sure media stream is closed when navigating away from page
    if (this.userMedia) {
      window.addEventListener('beforeunload', (event) => {
        this.reset()
      })
    }
  }

  start () {
    this.userMedia = _userMedia === undefined ? this.userMedia : _userMedia

    if (this.userMedia) {
      // ask user for access to their camera
      this.mediaDevices.getUserMedia({
        audio: false,
        video: true
      })
      .then((stream) => {
        this.updateState({
          videoStream: stream,
          cameraReady: true
        })
      })
      .catch((err) => {
        if (this.opts.enableFlash && this.detectFlash()) {
          // setTimeout(() => {
          //   this.opts.forceFlash = 1
          //   this.attach(elem)
          // }, 1)
        } else {
          console.log('Error:', err)
        }
      })
    } else if (this.opts.enableFlash && this.detectFlash()) {
      // flash fallback
      // needed for flash-to-js interface
      window.Webcam = Webcam
      this.updateState({
        useTheFlash: true
      })
      // elem.appendChild(div)
    } else {
      console.log('There was a problem!')
    }
  }

  /**
   * Detects if browser supports flash
   * Code snippet borrowed from: https://github.com/swfobject/swfobject
   *
   * @return {bool} flash supported
   */
  detectFlash () {
    var SHOCKWAVE_FLASH = 'Shockwave Flash'
    var SHOCKWAVE_FLASH_AX = 'ShockwaveFlash.ShockwaveFlash'
    var FLASH_MIME_TYPE = 'application/x-shockwave-flash'
    var win = window
    var nav = navigator
    var hasFlash = false

    if (typeof nav.plugins !== 'undefined' && typeof nav.plugins[SHOCKWAVE_FLASH] === 'object') {
      var desc = nav.plugins[SHOCKWAVE_FLASH].description
      if (desc && (typeof nav.mimeTypes !== 'undefined' && nav.mimeTypes[FLASH_MIME_TYPE] && nav.mimeTypes[FLASH_MIME_TYPE].enabledPlugin)) {
        hasFlash = true
      }
    } else if (typeof win.ActiveXObject !== 'undefined') {
      try {
        var ax = new win.ActiveXObject(SHOCKWAVE_FLASH_AX)
        if (ax) {
          var ver = ax.GetVariable('$version')
          if (ver) hasFlash = true
        }
      } catch (e) {}
    }

    return hasFlash
  }

  reset () {
    // shutdown camera, reset to potentially attach again
    if (this.preview_active) this.unfreeze()

    if (this.userMedia) {
      if (this.stream) {
        if (this.stream.getVideoTracks) {
          // get video track to call stop on it
          var tracks = this.stream.getVideoTracks()
          if (tracks && tracks[0] && tracks[0].stop) tracks[0].stop()
        } else if (this.stream.stop) {
          // deprecated, may be removed in future
          this.stream.stop()
        }
      }
      delete this.stream
      delete this.video
    }

    if (this.userMedia !== true) {
      // call for turn off camera in flash
      this.getMovie()._releaseCamera()
    }
  }

  getSWFHTML () {
    // Return HTML for embedding flash based webcam capture movie
    var swfURL = this.params.swfURL

    // make sure we aren't running locally (flash doesn't work)
    if (location.protocol.match(/file/)) {
      return '<h3 style="color:red">ERROR: the Webcam.js Flash fallback does not work from local disk.  Please run it from a web server.</h3>'
    }

    // make sure we have flash
    if (!this.detectFlash()) {
      return '<h3 style="color:red">No flash</h3>'
    }

    // set default swfURL if not explicitly set
    if (!swfURL) {
      // find our script tag, and use that base URL
      var base_url = ''
      var scpts = document.getElementsByTagName('script')
      for (var idx = 0, len = scpts.length; idx < len; idx++) {
        var src = scpts[idx].getAttribute('src')
        if (src && src.match(/\/webcam(\.min)?\.js/)) {
          base_url = src.replace(/\/webcam(\.min)?\.js.*$/, '')
          idx = len
        }
      }
      if (base_url) swfURL = base_url + '/webcam.swf'
      else swfURL = 'webcam.swf'
    }

    // // if this is the user's first visit, set flashvar so flash privacy settings panel is shown first
    // if (window.localStorage && !localStorage.getItem('visited')) {
    //   // this.params.new_user = 1
    //   localStorage.setItem('visited', 1)
    // }
    // this.params.new_user = 1
    // construct flashvars string
    var flashvars = ''
    for (var key in this.params) {
      if (flashvars) flashvars += '&'
      flashvars += key + '=' + escape(this.params[key])
    }

    // construct object/embed tag

    return html`<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" type="application/x-shockwave-flash" codebase="${this.protocol}://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0" width="${this.params.width}" height="${this.params.height}" id="webcam_movie_obj" align="middle"><param name="wmode" value="opaque" /><param name="allowScriptAccess" value="always" /><param name="allowFullScreen" value="false" /><param name="movie" value="${swfURL}" /><param name="loop" value="false" /><param name="menu" value="false" /><param name="quality" value="best" /><param name="bgcolor" value="#ffffff" /><param name="flashvars" value="${flashvars}"/><embed id="webcam_movie_embed" src="${swfURL}" wmode="opaque" loop="false" menu="false" quality="best" bgcolor="#ffffff" width="${this.params.width}" height="${this.params.height}" name="webcam_movie_embed" align="middle" allowScriptAccess="always" allowFullScreen="false" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" flashvars="${flashvars}"></embed></object>`
  }

  getMovie () {
    // get reference to movie object/embed in DOM
    var movie = document.getElementById('webcam_movie_obj')
    if (!movie || !movie._snap) movie = document.getElementById('webcam_movie_embed')
    if (!movie) console.log('getMovie error')
    return movie
  }

  /**
   * Stops the webcam capture and video playback.
   */
  stopWebcam () {
    let { video, videoStream } = this

    this.updateState({
      cameraReady: false
    })

    if (videoStream) {
      if (videoStream.stop) {
        videoStream.stop()
      } else if (videoStream.msStop) {
        videoStream.msStop()
      }

      videoStream.onended = null
      videoStream = null
    }

    if (video) {
      video.onerror = null
      video.pause()

      if (video.mozSrcObject) {
        video.mozSrcObject = null
      }

      video.src = ''
    }

    this.video = document.querySelector('.UppyWebcam-video')
    this.canvas = document.querySelector('.UppyWebcam-canvas')
  }

  flashNotify (type, msg) {
    // receive notification from flash about event
    switch (type) {
      case 'flashLoadComplete':
        // movie loaded successfully
        break

      case 'cameraLive':
        // camera is live and ready to snap
        this.live = true
        break

      case 'error':
        // Flash error
        console.log('There was a flash error', msg)
        break

      default:
        // catch-all event, just in case
        console.log('webcam flash_notify: ' + type + ': ' + msg)
        break
    }
  }

  configure (panel) {
    // open flash configuration panel -- specify tab name:
    // 'camera', 'privacy', 'default', 'localStorage', 'microphone', 'settingsManager'
    if (!panel) panel = 'camera'
    this.getMovie()._configure(panel)
  }

  /**
   * Begins recording the webcam stream and handles the media
   * after recording ends.
   */
  startRecording () {
    if (!this.videoStream) {
      console.log('Error: no video stream available')
      return
    }

    if (!this.mediaRecorder) {
      this.mediaRecorder = new window.MediaRecorder(this.videoStream)
    }

    let chunks = []

    this.mediaRecorder.onstop = (e) => {
      var blob = new Blob(chunks, {type: 'video/webm'})
      chunks = []
      const clip = window.URL.createObjectURL(blob)
      this.video.src = clip
    }

    this.mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data)
    }

    this.mediaRecorder.start()

    this.updateState({
      recording: true
    })

    console.log('recorder started')
  }

  /**
   * Ends media recording
   */
  stopRecording () {
    if (!this.mediaRecorder) {
      console.log('no media recorder exists')
      return
    }

    this.updateState({
      recording: false
    })

    this.mediaRecorder.stop()
  }

  /**
   * Takes a snapshot and displays it in a canvas.
   */
  generateImage (video, canvas, opts) {
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)

    var dataUrl = canvas.toDataURL(opts.mimeType)

    var file = dataURItoFile(dataUrl, {
      name: opts.name
    })

    return {
      dataUrl: dataUrl,
      data: file,
      type: opts.mimeType
    }
  }

  takeSnapshot () {
    const opts = {
      name: `webcam-${Date.now()}.jpg`,
      mimeType: 'image/jpeg'
    }

    const video = document.querySelector('.UppyWebcam-video')
    const canvas = document.querySelector('.UppyWebcam-canvas')

    const image = this.generateImage(video, canvas, opts)

    const tagFile = {
      source: this.id,
      name: opts.name,
      data: image.data,
      type: opts.type
    }

    this.core.emitter.emit('file-add', tagFile)
  }

  render (state) {
    if (!state.webcam.cameraReady && !state.webcam.useTheFlash) {
      return PermissionsScreen(state.webcam)
    }

    const stream = state.webcam.videoStream ? URL.createObjectURL(state.webcam.videoStream) : null

    return CameraScreen(extend(state.webcam, {
      onSnapshot: this.takeSnapshot,
      getSWFHTML: this.getSWFHTML,
      src: stream
    }))
  }

  focus () {
    const firstInput = document.querySelector(`${this.target} .UppyDummy-firstInput`)
    // only works for the first time if wrapped in setTimeout for some reason
    // firstInput.focus()
    setTimeout(function () {
      firstInput.focus()
    }, 10)
    this.start()
    // this.startWebcam()
  }

  install () {
    this.core.setState({
      webcam: {
        cameraReady: false
      }
    })

    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)
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
