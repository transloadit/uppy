import { h } from 'preact'

import { UIPlugin } from '@uppy/core'

import getFileTypeExtension from '@uppy/utils/lib/getFileTypeExtension'
import supportsMediaRecorder from './supportsMediaRecorder.js'
import RecordingScreen from './RecordingScreen.jsx'
import PermissionsScreen from './PermissionsScreen.jsx'
import locale from './locale.js'

import packageJson from '../package.json'

/**
 * Audio recording plugin
 */
export default class Audio extends UIPlugin {
  static VERSION = packageJson.version

  #stream = null

  #audioActive = false

  #recordingChunks = null

  #recorder = null

  #capturedMediaFile = null

  #mediaDevices = null

  #supportsUserMedia = null

  constructor (uppy, opts) {
    super(uppy, opts)
    this.#mediaDevices = navigator.mediaDevices
    this.#supportsUserMedia = this.#mediaDevices != null
    this.id = this.opts.id || 'Audio'
    this.type = 'acquirer'
    this.icon = () => (
      <svg className="uppy-DashboardTab-iconAudio" aria-hidden="true" focusable="false" width="32px" height="32px" viewBox="0 0 32 32">
        <path d="M21.143 12.297c.473 0 .857.383.857.857v2.572c0 3.016-2.24 5.513-5.143 5.931v2.64h2.572a.857.857 0 110 1.714H12.57a.857.857 0 110-1.714h2.572v-2.64C12.24 21.24 10 18.742 10 15.726v-2.572a.857.857 0 111.714 0v2.572A4.29 4.29 0 0016 20.01a4.29 4.29 0 004.286-4.285v-2.572c0-.474.384-.857.857-.857zM16 6.5a3 3 0 013 3v6a3 3 0 01-6 0v-6a3 3 0 013-3z" fill="currentcolor" fill-rule="nonzero" />
      </svg>
    )

    this.defaultLocale = locale

    this.opts = { ...opts }

    this.i18nInit()
    this.title = this.i18n('pluginNameAudio')

    this.setPluginState({
      hasAudio: false,
      audioReady: false,
      cameraError: null,
      recordingLengthSeconds: 0,
      audioSources: [],
      currentDeviceId: null,
    })
  }

  #hasAudioCheck () {
    if (!this.#mediaDevices) {
      return Promise.resolve(false)
    }

    return this.#mediaDevices.enumerateDevices().then(devices => {
      return devices.some(device => device.kind === 'audioinput')
    })
  }

  // eslint-disable-next-line consistent-return
  #start = (options = null) => {
    if (!this.#supportsUserMedia) {
      return Promise.reject(new Error('Microphone access not supported'))
    }

    this.#audioActive = true

    this.#hasAudioCheck().then(hasAudio => {
      this.setPluginState({
        hasAudio,
      })

      // ask user for access to their camera
      return this.#mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          this.#stream = stream

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
          this.#updateSources()

          this.setPluginState({
            currentDeviceId,
            audioReady: true,
          })
        })
        .catch((err) => {
          this.setPluginState({
            audioReady: false,
            cameraError: err,
          })
          this.uppy.info(err.message, 'error')
        })
    })
  }

  #startRecording = () => {
    // only used if supportsMediaRecorder() returned true
    // eslint-disable-next-line compat/compat
    this.#recorder = new MediaRecorder(this.#stream)
    this.#recordingChunks = []
    let stoppingBecauseOfMaxSize = false
    this.#recorder.addEventListener('dataavailable', (event) => {
      this.#recordingChunks.push(event.data)

      const { restrictions } = this.uppy.opts
      if (this.#recordingChunks.length > 1
          && restrictions.maxFileSize != null
          && !stoppingBecauseOfMaxSize) {
        const totalSize = this.#recordingChunks.reduce((acc, chunk) => acc + chunk.size, 0)
        // Exclude the initial chunk from the average size calculation because it is likely to be a very small outlier
        const averageChunkSize = (totalSize - this.#recordingChunks[0].size) / (this.#recordingChunks.length - 1)
        const expectedEndChunkSize = averageChunkSize * 3
        const maxSize = Math.max(0, restrictions.maxFileSize - expectedEndChunkSize)

        if (totalSize > maxSize) {
          stoppingBecauseOfMaxSize = true
          this.uppy.info(this.i18n('recordingStoppedMaxSize'), 'warning', 4000)
          this.#stopRecording()
        }
      }
    })

    // use a "time slice" of 500ms: ondataavailable will be called each 500ms
    // smaller time slices mean we can more accurately check the max file size restriction
    this.#recorder.start(500)

    // Start the recordingLengthTimer if we are showing the recording length.
    this.recordingLengthTimer = setInterval(() => {
      const currentRecordingLength = this.getPluginState().recordingLengthSeconds
      this.setPluginState({ recordingLengthSeconds: currentRecordingLength + 1 })
    }, 1000)

    this.setPluginState({
      isRecording: true,
    })
  }

  #stopRecording = () => {
    const stopped = new Promise((resolve) => {
      this.#recorder.addEventListener('stop', () => {
        resolve()
      })
      this.#recorder.stop()

      clearInterval(this.recordingLengthTimer)
      this.setPluginState({ recordingLengthSeconds: 0 })
    })

    return stopped.then(() => {
      this.setPluginState({
        isRecording: false,
      })
      return this.#getAudio()
    }).then((file) => {
      try {
        this.#capturedMediaFile = file
        // create object url for capture result preview
        this.setPluginState({
          recordedAudio: URL.createObjectURL(file.data),
        })
      } catch (err) {
        // Logging the error, exept restrictions, which is handled in Core
        if (!err.isRestriction) {
          this.uppy.log(err)
        }
      }
    }).then(() => {
      this.#recordingChunks = null
      this.#recorder = null
    }, (error) => {
      this.#recordingChunks = null
      this.#recorder = null
      throw error
    })
  }

  #discardRecordedAudio = () => {
    this.setPluginState({ recordedAudio: null })
    this.#capturedMediaFile = null
  }

  #submit = () => {
    try {
      if (this.#capturedMediaFile) {
        this.uppy.addFile(this.#capturedMediaFile)
      }
    } catch (err) {
      // Logging the error, exept restrictions, which is handled in Core
      if (!err.isRestriction) {
        this.uppy.log(err, 'warning')
      }
    }
  }

  #stop = async () => {
    if (this.#stream) {
      const audioTracks = this.#stream.getAudioTracks()
      audioTracks.forEach((track) => track.stop())
    }

    if (this.#recorder) {
      await new Promise((resolve) => {
        this.#recorder.addEventListener('stop', resolve, { once: true })
        this.#recorder.stop()

        clearInterval(this.recordingLengthTimer)
      })
    }

    this.#recordingChunks = null
    this.#recorder = null
    this.#audioActive = false
    this.#stream = null

    this.setPluginState({
      recordedAudio: null,
      isRecording: false,
      recordingLengthSeconds: 0,
    })
  }

  #getAudio () {
    // Sometimes in iOS Safari, Blobs (especially the first Blob in the recordingChunks Array)
    // have empty 'type' attributes (e.g. '') so we need to find a Blob that has a defined 'type'
    // attribute in order to determine the correct MIME type.
    const mimeType = this.#recordingChunks.find(blob => blob.type?.length > 0).type

    const fileExtension = getFileTypeExtension(mimeType)

    if (!fileExtension) {
      return Promise.reject(new Error(`Could not retrieve recording: Unsupported media type "${mimeType}"`))
    }

    const name = `audio-${Date.now()}.${fileExtension}`
    const blob = new Blob(this.#recordingChunks, { type: mimeType })
    const file = {
      source: this.id,
      name,
      data: new Blob([blob], { type: mimeType }),
      type: mimeType,
    }

    return Promise.resolve(file)
  }

  #changeSource = (deviceId) => {
    this.#stop()
    this.#start({ deviceId })
  }

  #updateSources = () => {
    this.#mediaDevices.enumerateDevices().then(devices => {
      this.setPluginState({
        audioSources: devices.filter((device) => device.kind === 'audioinput'),
      })
    })
  }

  render () {
    if (!this.#audioActive) {
      this.#start()
    }

    const audioState = this.getPluginState()

    if (!audioState.audioReady || !audioState.hasAudio) {
      return (
        <PermissionsScreen
          icon={this.icon}
          i18n={this.i18n}
          hasAudio={audioState.hasAudio}
        />
      )
    }

    return (
      <RecordingScreen
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...audioState}
        audioActive={this.#audioActive}
        onChangeSource={this.#changeSource}
        onStartRecording={this.#startRecording}
        onStopRecording={this.#stopRecording}
        onDiscardRecordedAudio={this.#discardRecordedAudio}
        onSubmit={this.#submit}
        onStop={this.#stop}
        i18n={this.i18n}
        showAudioSourceDropdown={this.opts.showAudioSourceDropdown}
        supportsRecording={supportsMediaRecorder()}
        recording={audioState.isRecording}
        stream={this.#stream}
      />
    )
  }

  install () {
    this.setPluginState({
      audioReady: false,
      recordingLengthSeconds: 0,
    })

    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }

    if (this.#mediaDevices) {
      this.#updateSources()

      this.#mediaDevices.ondevicechange = () => {
        this.#updateSources()

        if (this.#stream) {
          let restartStream = true

          const { audioSources, currentDeviceId } = this.getPluginState()

          audioSources.forEach((audioSource) => {
            if (currentDeviceId === audioSource.deviceId) {
              restartStream = false
            }
          })

          if (restartStream) {
            this.#stop()
            this.#start()
          }
        }
      }
    }
  }

  uninstall () {
    if (this.#stream) {
      this.#stop()
    }

    this.unmount()
  }
}
