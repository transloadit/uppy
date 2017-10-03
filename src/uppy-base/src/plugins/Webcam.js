'use strict'

const { dataURItoFile } = require('../../../core/Utils')

/**
 * Webcam Plugin
 */
module.exports = class Webcam {
  constructor (opts = {}) {
    this.supportsUserMedia = true
    this.protocol = location.protocol.match(/https/i) ? 'https' : 'http'

    // set default options
    const defaultOptions = {
      modes: []
    }

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
    this.checkUserMediaSupport = this.checkUserMediaSupport.bind(this)
    this.getMediaDevices = this.getMediaDevices.bind(this)
  }

  /**
   * Checks for getUserMedia support
   */
  init () {
    // initialize, check for getUserMedia support
    this.mediaDevices = this.getMediaDevices()

    this.supportsUserMedia = this.checkUserMediaSupport(this.mediaDevices)

    // Make sure media stream is closed when navigating away from page
    if (this.supportsUserMedia) {
      window.addEventListener('beforeunload', (event) => {
        this.reset()
      })
    }
  }

  // Setup getUserMedia, with polyfill for older browsers
  // Adapted from: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
  getMediaDevices () {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      return navigator.mediaDevices
    }

    let getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia
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

  checkUserMediaSupport (mediaDevices) {
    // Older versions of firefox (< 21) apparently claim support but user media does not actually work
    if (navigator.userAgent.match(/Firefox\D+(\d+)/)) {
      if (parseInt(RegExp.$1, 10) < 21) {
        return false
      }
    }

    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL
    return !!mediaDevices && !!window.URL
  }

  start () {
    if (!this.supportsUserMedia) {
      return Promise.reject(new Error('UserMedia not supported'))
    }

    const acceptsAudio = this.opts.modes.indexOf('video-audio') !== -1 ||
      this.opts.modes.indexOf('audio-only') !== -1
    const acceptsVideo = this.opts.modes.indexOf('video-audio') !== -1 ||
      this.opts.modes.indexOf('video-only') !== -1 ||
      this.opts.modes.indexOf('picture') !== -1

    // ask user for access to their camera
    return this.mediaDevices.getUserMedia({
      audio: acceptsAudio,
      video: acceptsVideo
    })
  }

  reset () {
    if (!this.supportsUserMedia) {
      return
    }

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
