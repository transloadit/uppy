'use strict'

const { dataURItoFile } = require('../../../core/Utils')

/**
 * Webcam Plugin
 */
module.exports = class Webcam {
  constructor (opts = {}, params = {}) {
    this.userMedia = true
    this.protocol = location.protocol.match(/https/i) ? 'https' : 'http'

    // set default options
    const defaultOptions = {
      enableFlash: true,
      modes: []
    }

    const defaultParams = {
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

    this.params = Object.assign({}, defaultParams, params)

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    // Camera controls
    this.start = this.start.bind(this)
    this.init = this.init.bind(this)
    this.stop = this.stop.bind(this)
    // this.startRecording = this.startRecording.bind(this)
    // this.stopRecording = this.stopRecording.bind(this)
    this.takeSnapshot = this.takeSnapshot.bind(this)
    this.getImage = this.getImage.bind(this)
    this.getSWFHTML = this.getSWFHTML.bind(this)
    this.detectFlash = this.detectFlash.bind(this)
    this.getUserMedia = this.getUserMedia.bind(this)
    this.getMediaDevices = this.getMediaDevices.bind(this)
  }

  /**
   * Checks for getUserMedia support
   */
  init () {
    // initialize, check for getUserMedia support
    this.mediaDevices = this.getMediaDevices()

    this.userMedia = this.getUserMedia(this.mediaDevices)

    // Make sure media stream is closed when navigating away from page
    if (this.userMedia) {
      window.addEventListener('beforeunload', (event) => {
        this.reset()
      })
    }

    return {
      mediaDevices: this.mediaDevices,
      userMedia: this.userMedia
    }
  }

  // Setup getUserMedia, with polyfill for older browsers
  // Adapted from: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
  getMediaDevices () {
    return (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      ? navigator.mediaDevices : ((navigator.mozGetUserMedia || navigator.webkitGetUserMedia) ? {
        getUserMedia: function (opts) {
          return new Promise(function (resolve, reject) {
            (navigator.mozGetUserMedia ||
            navigator.webkitGetUserMedia).call(navigator, opts, resolve, reject)
          })
        }
      } : null)
  }

  getUserMedia (mediaDevices) {
    const userMedia = true
    // Older versions of firefox (< 21) apparently claim support but user media does not actually work
    if (navigator.userAgent.match(/Firefox\D+(\d+)/)) {
      if (parseInt(RegExp.$1, 10) < 21) {
        return null
      }
    }

    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL
    return userMedia && !!mediaDevices && !!window.URL
  }

  start () {
    this.userMedia = this._userMedia === undefined ? this.userMedia : this._userMedia
    return new Promise((resolve, reject) => {
      if (this.userMedia) {
        const acceptsAudio = this.opts.modes.indexOf('video-audio') !== -1 ||
          this.opts.modes.indexOf('audio-only') !== -1
        const acceptsVideo = this.opts.modes.indexOf('video-audio') !== -1 ||
          this.opts.modes.indexOf('video-only') !== -1 ||
          this.opts.modes.indexOf('picture') !== -1

        // ask user for access to their camera
        this.mediaDevices.getUserMedia({
          audio: acceptsAudio,
          video: acceptsVideo
        })
        .then((stream) => {
          return resolve(stream)
        })
        .catch((err) => {
          return reject(err)
        })
      }
    })
  }

  /**
   * Detects if browser supports flash
   * Code snippet borrowed from: https://github.com/swfobject/swfobject
   *
   * @return {bool} flash supported
   */
  detectFlash () {
    const SHOCKWAVE_FLASH = 'Shockwave Flash'
    const SHOCKWAVE_FLASH_AX = 'ShockwaveFlash.ShockwaveFlash'
    const FLASH_MIME_TYPE = 'application/x-shockwave-flash'
    const win = window
    const nav = navigator
    let hasFlash = false

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
      var baseUrl = ''
      var scpts = document.getElementsByTagName('script')
      for (var idx = 0, len = scpts.length; idx < len; idx++) {
        var src = scpts[idx].getAttribute('src')
        if (src && src.match(/\/webcam(\.min)?\.js/)) {
          baseUrl = src.replace(/\/webcam(\.min)?\.js.*$/, '')
          idx = len
        }
      }
      if (baseUrl) swfURL = baseUrl + '/webcam.swf'
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

    return `<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" type="application/x-shockwave-flash" codebase="${this.protocol}://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0" width="${this.params.width}" height="${this.params.height}" id="webcam_movie_obj" align="middle"><param name="wmode" value="opaque" /><param name="allowScriptAccess" value="always" /><param name="allowFullScreen" value="false" /><param name="movie" value="${swfURL}" /><param name="loop" value="false" /><param name="menu" value="false" /><param name="quality" value="best" /><param name="bgcolor" value="#ffffff" /><param name="flashvars" value="${flashvars}"/><embed id="webcam_movie_embed" src="${swfURL}" wmode="opaque" loop="false" menu="false" quality="best" bgcolor="#ffffff" width="${this.params.width}" height="${this.params.height}" name="webcam_movie_embed" align="middle" allowScriptAccess="always" allowFullScreen="false" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" flashvars="${flashvars}"></embed></object>`
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
  stop () {
    let { videoStream } = this

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
   * Takes a snapshot and displays it in a canvas.
   */
  getImage (video, opts) {
    var canvas = document.createElement('canvas')
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

  takeSnapshot (video, canvas) {
    const opts = {
      name: `webcam-${Date.now()}.jpg`,
      mimeType: 'image/jpeg'
    }

    const image = this.getImage(video, canvas, opts)

    const tagFile = {
      source: this.id,
      name: opts.name,
      data: image.data,
      type: opts.type
    }

    return tagFile
  }
}
