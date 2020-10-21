const { h } = require('preact')
const { Plugin } = require('@uppy/core')
const Translator = require('@uppy/utils/lib/Translator')
const getFileTypeExtension = require('@uppy/utils/lib/getFileTypeExtension')
const mimeTypes = require('@uppy/utils/lib/mimeTypes')
const canvasToBlob = require('@uppy/utils/lib/canvasToBlob')
const supportsMediaRecorder = require('./supportsMediaRecorder')
const CameraIcon = require('./CameraIcon')
const CameraScreen = require('./CameraScreen')
const PermissionsScreen = require('./PermissionsScreen')

/**
 * Normalize a MIME type or file extension into a MIME type.
 *
 * @param {string} fileType - MIME type or a file extension prefixed with `.`.
 * @returns {string|undefined} The MIME type or `undefined` if the fileType is an extension and is not known.
 */
function toMimeType (fileType) {
  if (fileType[0] === '.') {
    return mimeTypes[fileType.slice(1)]
  }
  return fileType
}

/**
 * Is this MIME type a video?
 *
 * @param {string} mimeType - MIME type.
 * @returns {boolean}
 */
function isVideoMimeType (mimeType) {
  return /^video\/[^*]+$/.test(mimeType)
}

/**
 * Is this MIME type an image?
 *
 * @param {string} mimeType - MIME type.
 * @returns {boolean}
 */
function isImageMimeType (mimeType) {
  return /^image\/[^*]+$/.test(mimeType)
}

/**
 * Setup getUserMedia, with polyfill for older browsers
 * Adapted from: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
 */
function getMediaDevices () {
  // eslint-disable-next-line compat/compat
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // eslint-disable-next-line compat/compat
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
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.mediaDevices = getMediaDevices()
    this.supportsUserMedia = !!this.mediaDevices
    this.protocol = location.protocol.match(/https/i) ? 'https' : 'http'
    this.id = this.opts.id || 'Webcam'
    this.title = this.opts.title || 'Camera'
    this.type = 'acquirer'
    this.icon = () => (
      <svg aria-hidden="true" focusable="false" width="32" height="32" viewBox="0 0 32 32">
        <g fill="none" fill-rule="evenodd">
          <rect fill="#03BFEF" width="32" height="32" rx="16" />
          <path d="M22 11c1.133 0 2 .867 2 2v7.333c0 1.134-.867 2-2 2H10c-1.133 0-2-.866-2-2V13c0-1.133.867-2 2-2h2.333l1.134-1.733C13.6 9.133 13.8 9 14 9h4c.2 0 .4.133.533.267L19.667 11H22zm-6 1.533a3.764 3.764 0 0 0-3.8 3.8c0 2.129 1.672 3.801 3.8 3.801s3.8-1.672 3.8-3.8c0-2.13-1.672-3.801-3.8-3.801zm0 6.261c-1.395 0-2.46-1.066-2.46-2.46 0-1.395 1.065-2.461 2.46-2.461s2.46 1.066 2.46 2.46c0 1.395-1.065 2.461-2.46 2.461z" fill="#FFF" fill-rule="nonzero" />
        </g>
      </svg>
    )

    this.defaultLocale = {
      strings: {
        smile: 'Smile!',
        takePicture: 'Take a picture',
        startRecording: 'Begin video recording',
        stopRecording: 'Stop video recording',
        allowAccessTitle: 'Please allow access to your camera',
        allowAccessDescription: 'In order to take pictures or record video with your camera, please allow camera access for this site.',
        noCameraTitle: 'Camera Not Available',
        noCameraDescription: 'In order to take pictures or record video, please connect a camera device',
        recordingStoppedMaxSize: 'Recording stopped because the file size is about to exceed the limit',
        recordingLength: 'Recording length %{recording_length}'
      }
    }

    // set default options
    const defaultOptions = {
      onBeforeSnapshot: () => Promise.resolve(),
      countdown: false,
      modes: [
        'video-audio',
        'video-only',
        'audio-only',
        'picture'
      ],
      mirror: true,
      showVideoSourceDropdown: false,
      facingMode: 'user',
      preferredImageMimeType: null,
      preferredVideoMimeType: null,
      showRecordingLength: false
    }

    this.opts = { ...defaultOptions, ...opts }

    this.i18nInit()

    this.install = this.install.bind(this)
    this.setPluginState = this.setPluginState.bind(this)

    this.render = this.render.bind(this)

    // Camera controls
    this._start = this._start.bind(this)
    this._stop = this._stop.bind(this)
    this._takeSnapshot = this._takeSnapshot.bind(this)
    this._startRecording = this._startRecording.bind(this)
    this._stopRecording = this._stopRecording.bind(this)
    this._oneTwoThreeSmile = this._oneTwoThreeSmile.bind(this)
    this._focus = this._focus.bind(this)
    this._changeVideoSource = this._changeVideoSource.bind(this)

    this.webcamActive = false

    if (this.opts.countdown) {
      this.opts.onBeforeSnapshot = this._oneTwoThreeSmile
    }

    this.setPluginState({
      hasCamera: false,
      cameraReady: false,
      cameraError: null,
      recordingLengthSeconds: 0,
      videoSources: [],
      currentDeviceId: null
    })
  }

  setOptions (newOpts) {
    super.setOptions({
      ...newOpts,
      videoConstraints: {
        // May be undefined but ... handles that
        ...this.opts.videoConstraints,
        ...newOpts?.videoConstraints
      }
    })

    this.i18nInit()
  }

  i18nInit () {
    this.translator = new Translator([this.defaultLocale, this.uppy.locale, this.opts.locale])
    this.i18n = this.translator.translate.bind(this.translator)
    this.i18nArray = this.translator.translateArray.bind(this.translator)
    this.setPluginState() // so that UI re-renders and we see the updated locale
  }

  hasCameraCheck () {
    if (!this.mediaDevices) {
      return Promise.resolve(false)
    }

    return this.mediaDevices.enumerateDevices().then(devices => {
      return devices.some(device => device.kind === 'videoinput')
    })
  }

  getConstraints (deviceId = null) {
    const acceptsAudio = this.opts.modes.indexOf('video-audio') !== -1 ||
      this.opts.modes.indexOf('audio-only') !== -1
    const acceptsVideo = this.opts.modes.indexOf('video-audio') !== -1 ||
      this.opts.modes.indexOf('video-only') !== -1 ||
      this.opts.modes.indexOf('picture') !== -1

    const videoConstraints = {
      ...(this.opts.videoConstraints ?? { facingMode: this.opts.facingMode }),
      // facingMode takes precedence over deviceId, and not needed
      // when specific device is selected
      ...(deviceId ? { deviceId, facingMode: null } : {})
    }

    return {
      audio: acceptsAudio,
      video: acceptsVideo ? videoConstraints : false
    }
  }

  _start (options = null) {
    if (!this.supportsUserMedia) {
      return Promise.reject(new Error('Webcam access not supported'))
    }

    this.webcamActive = true

    const constraints = this.getConstraints(options && options.deviceId ? options.deviceId : null)

    this.hasCameraCheck().then(hasCamera => {
      this.setPluginState({
        hasCamera: hasCamera
      })

      // ask user for access to their camera
      return this.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          this.stream = stream

          let currentDeviceId = null
          if (!options || !options.deviceId) {
            currentDeviceId = stream.getVideoTracks()[0].getSettings().deviceId
          } else {
            stream.getVideoTracks().forEach((videoTrack) => {
              if (videoTrack.getSettings().deviceId === options.deviceId) {
                currentDeviceId = videoTrack.getSettings().deviceId
              }
            })
          }

          // Update the sources now, so we can access the names.
          this.updateVideoSources()

          this.setPluginState({
            currentDeviceId,
            cameraReady: true
          })
        })
        .catch((err) => {
          this.setPluginState({
            cameraReady: false,
            cameraError: err
          })
          this.uppy.info(err.message, 'error')
        })
    })
  }

  /**
   * @returns {object}
   */
  _getMediaRecorderOptions () {
    const options = {}

    // Try to use the `opts.preferredVideoMimeType` or one of the `allowedFileTypes` for the recording.
    // If the browser doesn't support it, we'll fall back to the browser default instead.
    // Safari doesn't have the `isTypeSupported` API.
    if (MediaRecorder.isTypeSupported) {
      const { restrictions } = this.uppy.opts
      let preferredVideoMimeTypes = []
      if (this.opts.preferredVideoMimeType) {
        preferredVideoMimeTypes = [this.opts.preferredVideoMimeType]
      } else if (restrictions.allowedFileTypes) {
        preferredVideoMimeTypes = restrictions.allowedFileTypes.map(toMimeType).filter(isVideoMimeType)
      }

      const acceptableMimeTypes = preferredVideoMimeTypes.filter((candidateType) =>
        MediaRecorder.isTypeSupported(candidateType) &&
          getFileTypeExtension(candidateType))
      if (acceptableMimeTypes.length > 0) {
        options.mimeType = acceptableMimeTypes[0]
      }
    }

    return options
  }

  _startRecording () {
    // only used if supportsMediaRecorder() returned true
    // eslint-disable-next-line compat/compat
    this.recorder = new MediaRecorder(this.stream, this._getMediaRecorderOptions())
    this.recordingChunks = []
    let stoppingBecauseOfMaxSize = false
    this.recorder.addEventListener('dataavailable', (event) => {
      this.recordingChunks.push(event.data)

      const { restrictions } = this.uppy.opts
      if (this.recordingChunks.length > 1 &&
          restrictions.maxFileSize != null &&
          !stoppingBecauseOfMaxSize) {
        const totalSize = this.recordingChunks.reduce((acc, chunk) => acc + chunk.size, 0)
        // Exclude the initial chunk from the average size calculation because it is likely to be a very small outlier
        const averageChunkSize = (totalSize - this.recordingChunks[0].size) / (this.recordingChunks.length - 1)
        const expectedEndChunkSize = averageChunkSize * 3
        const maxSize = Math.max(0, restrictions.maxFileSize - expectedEndChunkSize)

        if (totalSize > maxSize) {
          stoppingBecauseOfMaxSize = true
          this.uppy.info(this.i18n('recordingStoppedMaxSize'), 'warning', 4000)
          this._stopRecording()
        }
      }
    })

    // use a "time slice" of 500ms: ondataavailable will be called each 500ms
    // smaller time slices mean we can more accurately check the max file size restriction
    this.recorder.start(500)

    if (this.opts.showRecordingLength) {
      // Start the recordingLengthTimer if we are showing the recording length.
      this.recordingLengthTimer = setInterval(() => {
        const currentRecordingLength = this.getPluginState().recordingLengthSeconds
        this.setPluginState({ recordingLengthSeconds: currentRecordingLength + 1 })
      }, 1000)
    }

    this.setPluginState({
      isRecording: true
    })
  }

  _stopRecording () {
    const stopped = new Promise((resolve, reject) => {
      this.recorder.addEventListener('stop', () => {
        resolve()
      })
      this.recorder.stop()

      if (this.opts.showRecordingLength) {
        // Stop the recordingLengthTimer if we are showing the recording length.
        clearInterval(this.recordingLengthTimer)
        this.setPluginState({ recordingLengthSeconds: 0 })
      }
    })

    return stopped.then(() => {
      this.setPluginState({
        isRecording: false
      })
      return this.getVideo()
    }).then((file) => {
      try {
        this.uppy.addFile(file)
      } catch (err) {
        // Logging the error, exept restrictions, which is handled in Core
        if (!err.isRestriction) {
          this.uppy.log(err)
        }
      }
    }).then(() => {
      this.recordingChunks = null
      this.recorder = null
    }, (error) => {
      this.recordingChunks = null
      this.recorder = null
      throw error
    })
  }

  _stop () {
    if (this.stream) {
      this.stream.getAudioTracks().forEach((track) => {
        track.stop()
      })
      this.stream.getVideoTracks().forEach((track) => {
        track.stop()
      })
    }
    this.webcamActive = false
    this.stream = null
  }

  _getVideoElement () {
    return this.el.querySelector('.uppy-Webcam-video')
  }

  _oneTwoThreeSmile () {
    return new Promise((resolve, reject) => {
      let count = this.opts.countdown

      const countDown = setInterval(() => {
        if (!this.webcamActive) {
          clearInterval(countDown)
          this.captureInProgress = false
          return reject(new Error('Webcam is not active'))
        }

        if (count > 0) {
          this.uppy.info(`${count}...`, 'warning', 800)
          count--
        } else {
          clearInterval(countDown)
          this.uppy.info(this.i18n('smile'), 'success', 1500)
          setTimeout(() => resolve(), 1500)
        }
      }, 1000)
    })
  }

  _takeSnapshot () {
    if (this.captureInProgress) return
    this.captureInProgress = true

    this.opts.onBeforeSnapshot().catch((err) => {
      const message = typeof err === 'object' ? err.message : err
      this.uppy.info(message, 'error', 5000)
      return Promise.reject(new Error(`onBeforeSnapshot: ${message}`))
    }).then(() => {
      return this._getImage()
    }).then((tagFile) => {
      this.captureInProgress = false
      try {
        this.uppy.addFile(tagFile)
      } catch (err) {
        // Logging the error, except restrictions, which is handled in Core
        if (!err.isRestriction) {
          this.uppy.log(err)
        }
      }
    }, (error) => {
      this.captureInProgress = false
      throw error
    })
  }

  _getImage () {
    const video = this._getVideoElement()
    if (!video) {
      return Promise.reject(new Error('No video element found, likely due to the Webcam tab being closed.'))
    }

    const width = video.videoWidth
    const height = video.videoHeight

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)

    const { restrictions } = this.uppy.opts
    let preferredImageMimeTypes = []
    if (this.opts.preferredImageMimeType) {
      preferredImageMimeTypes = [this.opts.preferredImageMimeType]
    } else if (restrictions.allowedFileTypes) {
      preferredImageMimeTypes = restrictions.allowedFileTypes.map(toMimeType).filter(isImageMimeType)
    }

    const mimeType = preferredImageMimeTypes[0] || 'image/jpeg'
    const ext = getFileTypeExtension(mimeType) || 'jpg'
    const name = `cam-${Date.now()}.${ext}`

    return canvasToBlob(canvas, mimeType).then((blob) => {
      return {
        source: this.id,
        name: name,
        data: new Blob([blob], { type: mimeType }),
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
      data: new Blob([blob], { type: mimeType }),
      type: mimeType
    }

    return Promise.resolve(file)
  }

  _focus () {
    if (!this.opts.countdown) return
    setTimeout(() => {
      this.uppy.info(this.i18n('smile'), 'success', 1500)
    }, 1000)
  }

  _changeVideoSource (deviceId) {
    this._stop()
    this._start({ deviceId: deviceId })
  }

  updateVideoSources () {
    this.mediaDevices.enumerateDevices().then(devices => {
      this.setPluginState({
        videoSources: devices.filter((device) => device.kind === 'videoinput')
      })
    })
  }

  render () {
    if (!this.webcamActive) {
      this._start()
    }

    const webcamState = this.getPluginState()

    if (!webcamState.cameraReady || !webcamState.hasCamera) {
      return (
        <PermissionsScreen
          icon={CameraIcon}
          i18n={this.i18n}
          hasCamera={webcamState.hasCamera}
        />
      )
    }

    return (
      <CameraScreen
        {...webcamState}
        onChangeVideoSource={this._changeVideoSource}
        onSnapshot={this._takeSnapshot}
        onStartRecording={this._startRecording}
        onStopRecording={this._stopRecording}
        onFocus={this._focus}
        onStop={this._stop}
        i18n={this.i18n}
        modes={this.opts.modes}
        showRecordingLength={this.opts.showRecordingLength}
        showVideoSourceDropdown={this.opts.showVideoSourceDropdown}
        supportsRecording={supportsMediaRecorder()}
        recording={webcamState.isRecording}
        mirror={this.opts.mirror}
        src={this.stream}
      />
    )
  }

  install () {
    this.setPluginState({
      cameraReady: false,
      recordingLengthSeconds: 0
    })

    const target = this.opts.target
    if (target) {
      this.mount(target, this)
    }

    if (this.mediaDevices) {
      this.updateVideoSources()

      this.mediaDevices.ondevicechange = (event) => {
        this.updateVideoSources()

        if (this.stream) {
          let restartStream = true

          const { videoSources, currentDeviceId } = this.getPluginState()

          videoSources.forEach((videoSource) => {
            if (currentDeviceId === videoSource.deviceId) {
              restartStream = false
            }
          })

          if (restartStream) {
            this._stop()
            this._start()
          }
        }
      }
    }
  }

  uninstall () {
    if (this.stream) {
      this._stop()
    }

    this.unmount()
  }
}
