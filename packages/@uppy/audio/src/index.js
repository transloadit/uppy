const { h } = require('preact')
const { Plugin } = require('@uppy/core')
const Translator = require('@uppy/utils/lib/Translator')
const getFileTypeExtension = require('@uppy/utils/lib/getFileTypeExtension')
const mimeTypes = require('@uppy/utils/lib/mimeTypes')
const supportsMediaRecorder = require('./supportsMediaRecorder')
const CameraIcon = require('./CameraIcon')
const CameraScreen = require('./CameraScreen')
const PermissionsScreen = require('./PermissionsScreen')
const packageJsonVersion = require('../package.json').version

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
    },
  }
}
/**
 * Webcam
 */
module.exports = class Audio extends Plugin {
  static VERSION = packageJsonVersion

  constructor (uppy, opts) {
    super(uppy, opts)
    this.mediaDevices = getMediaDevices()
    this.supportsUserMedia = !!this.mediaDevices
    // eslint-disable-next-line no-restricted-globals
    this.protocol = location.protocol.match(/https/i) ? 'https' : 'http'
    this.id = this.opts.id || 'Audio'
    this.title = this.opts.title || 'Audio'
    this.type = 'acquirer'
    this.capturedMediaFile = null
    this.icon = () => (
      <svg aria-hidden="true" focusable="false" width="32px" height="32px" viewBox="0 0 32 32">
        <g fill="none" fill-rule="evenodd">
          <rect fill="#9B59B6" width="32" height="32" rx="16" />
          <path d="M16 20c-2.21 0-4-1.71-4-3.818V9.818C12 7.71 13.79 6 16 6s4 1.71 4 3.818v6.364C20 18.29 18.21 20 16 20zm-6.364-7h.637c.351 0 .636.29.636.65v1.95c0 3.039 2.565 5.477 5.6 5.175 2.645-.264 4.582-2.692 4.582-5.407V13.65c0-.36.285-.65.636-.65h.637c.351 0 .636.29.636.65v1.631c0 3.642-2.544 6.888-6.045 7.382v1.387h2.227c.351 0 .636.29.636.65v.65c0 .36-.285.65-.636.65h-6.364a.643.643 0 0 1-.636-.65v-.65c0-.36.285-.65.636-.65h2.227v-1.372C11.637 22.2 9 19.212 9 15.6v-1.95c0-.36.285-.65.636-.65z" fill="#FFF" fill-rule="nonzero" />
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
        recordingLength: 'Recording length %{recording_length}',
        submitRecordedFile: 'Submit recorded file',
        discardRecordedFile: 'Discard recorded file',
      },
    }

    // set default options
    const defaultOptions = {
      countdown: false,
      showRecordingLength: false,
    }

    this.opts = { ...defaultOptions, ...opts }

    this.i18nInit()

    this.install = this.install.bind(this)
    this.setPluginState = this.setPluginState.bind(this)

    this.render = this.render.bind(this)

    // Camera controls
    this.start = this.start.bind(this)
    this.stop = this.stop.bind(this)
    this.startRecording = this.startRecording.bind(this)
    this.stopRecording = this.stopRecording.bind(this)
    this.discardRecordedVideo = this.discardRecordedVideo.bind(this)
    this.submit = this.submit.bind(this)
    this.oneTwoThreeSmile = this.oneTwoThreeSmile.bind(this)
    this.changeVideoSource = this.changeVideoSource.bind(this)

    this.micActive = false

    this.setPluginState({
      hasCamera: false,
      cameraReady: false,
      cameraError: null,
      recordingLengthSeconds: 0,
      videoSources: [],
      currentDeviceId: null,
    })
  }

  setOptions (newOpts) {
    super.setOptions({
      ...newOpts,
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
      return devices.some(device => device.kind === 'audioinput')
    })
  }

  // eslint-disable-next-line consistent-return
  start (options = null) {
    if (!this.supportsUserMedia) {
      return Promise.reject(new Error('Webcam access not supported'))
    }

    this.micActive = true

    this.hasCameraCheck().then(hasCamera => {
      this.setPluginState({
        hasCamera,
      })

      // ask user for access to their camera
      return this.mediaDevices.getUserMedia({ audio: true, video: false })
        .then((stream) => {
          this.stream = stream

          let currentDeviceId = null
          const tracks = stream.getAudioTracks()

          if (!options || !options.deviceId) {
            currentDeviceId = tracks[0].getSettings().deviceId
          } else {
            tracks.forEach((track) => {
              if (track.getSettings().deviceId === options.deviceId) {
                currentDeviceId = track.getSettings().deviceId
              }
            })
          }

          // Update the sources now, so we can access the names.
          this.updateVideoSources()

          this.setPluginState({
            currentDeviceId,
            cameraReady: true,
          })
        })
        .catch((err) => {
          this.setPluginState({
            cameraReady: false,
            cameraError: err,
          })
          this.uppy.info(err.message, 'error')
        })
    })
  }

  /**
   * @returns {object}
   */
  getMediaRecorderOptions () {
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

      const filterSupportedTypes = (candidateType) => MediaRecorder.isTypeSupported(candidateType)
        && getFileTypeExtension(candidateType)
      const acceptableMimeTypes = preferredVideoMimeTypes.filter(filterSupportedTypes)

      if (acceptableMimeTypes.length > 0) {
        // eslint-disable-next-line prefer-destructuring
        options.mimeType = acceptableMimeTypes[0]
      }
    }

    return options
  }

  startRecording () {
    // only used if supportsMediaRecorder() returned true
    // eslint-disable-next-line compat/compat
    this.recorder = new MediaRecorder(this.stream, this.getMediaRecorderOptions())
    this.recordingChunks = []
    let stoppingBecauseOfMaxSize = false
    this.recorder.addEventListener('dataavailable', (event) => {
      this.recordingChunks.push(event.data)

      const { restrictions } = this.uppy.opts
      if (this.recordingChunks.length > 1
          && restrictions.maxFileSize != null
          && !stoppingBecauseOfMaxSize) {
        const totalSize = this.recordingChunks.reduce((acc, chunk) => acc + chunk.size, 0)
        // Exclude the initial chunk from the average size calculation because it is likely to be a very small outlier
        const averageChunkSize = (totalSize - this.recordingChunks[0].size) / (this.recordingChunks.length - 1)
        const expectedEndChunkSize = averageChunkSize * 3
        const maxSize = Math.max(0, restrictions.maxFileSize - expectedEndChunkSize)

        if (totalSize > maxSize) {
          stoppingBecauseOfMaxSize = true
          this.uppy.info(this.i18n('recordingStoppedMaxSize'), 'warning', 4000)
          this.stopRecording()
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
      isRecording: true,
    })
  }

  stopRecording () {
    const stopped = new Promise((resolve) => {
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
        isRecording: false,
      })
      return this.getVideo()
    }).then((file) => {
      try {
        this.capturedMediaFile = file
        // create object url for capture result preview
        this.setPluginState({
          // eslint-disable-next-line compat/compat
          recordedVideo: URL.createObjectURL(file.data),
        })
        this.opts.mirror = false
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

  discardRecordedVideo () {
    this.setPluginState({ recordedVideo: null })
    this.opts.mirror = true
    this.capturedMediaFile = null
  }

  submit () {
    try {
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
    if (this.stream) {
      this.stream.getAudioTracks().forEach((track) => {
        track.stop()
      })
    }
    this.micActive = false
    this.stream = null
    this.setPluginState({
      recordedVideo: null,
    })
  }

  getVideoElement () {
    return this.el.querySelector('.uppy-Audio-video')
  }

  oneTwoThreeSmile () {
    return new Promise((resolve, reject) => {
      let count = this.opts.countdown

      // eslint-disable-next-line consistent-return
      const countDown = setInterval(() => {
        if (!this.micActive) {
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

  getVideo () {
    // Sometimes in iOS Safari, Blobs (especially the first Blob in the recordingChunks Array)
    // have empty 'type' attributes (e.g. '') so we need to find a Blob that has a defined 'type'
    // attribute in order to determine the correct MIME type.
    const mimeType = this.recordingChunks.find(blob => blob.type?.length > 0).type

    const fileExtension = getFileTypeExtension(mimeType)

    if (!fileExtension) {
      return Promise.reject(new Error(`Could not retrieve recording: Unsupported media type "${mimeType}"`))
    }

    const name = `webcam-${Date.now()}.${fileExtension}`
    const blob = new Blob(this.recordingChunks, { type: mimeType })
    const file = {
      source: this.id,
      name,
      data: new Blob([blob], { type: mimeType }),
      type: mimeType,
    }

    return Promise.resolve(file)
  }

  changeVideoSource (deviceId) {
    this.stop()
    this.start({ deviceId })
  }

  updateVideoSources () {
    this.mediaDevices.enumerateDevices().then(devices => {
      this.setPluginState({
        videoSources: devices.filter((device) => device.kind === 'audioinput'),
      })
    })
  }

  render () {
    if (!this.micActive) {
      this.start()
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
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...webcamState}
        onChangeVideoSource={this.changeVideoSource}
        onStartRecording={this.startRecording}
        onStopRecording={this.stopRecording}
        onDiscardRecordedVideo={this.discardRecordedVideo}
        onSubmit={this.submit}
        onStop={this.stop}
        i18n={this.i18n}
        showRecordingLength={this.opts.showRecordingLength}
        showVideoSourceDropdown={this.opts.showVideoSourceDropdown}
        supportsRecording={supportsMediaRecorder()}
        recording={webcamState.isRecording}
        src={this.stream}
      />
    )
  }

  install () {
    this.setPluginState({
      cameraReady: false,
      recordingLengthSeconds: 0,
    })

    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }

    if (this.mediaDevices) {
      this.updateVideoSources()

      this.mediaDevices.ondevicechange = () => {
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
            this.stop()
            this.start()
          }
        }
      }
    }
  }

  uninstall () {
    if (this.stream) {
      this.stop()
    }

    this.unmount()
  }
}
