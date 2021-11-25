/* eslint-disable jsx-a11y/media-has-caption */
const { h, Component } = require('preact')
const RecordButton = require('./RecordButton')
const RecordingLength = require('./RecordingLength')
const AudioSourceSelect = require('./AudioSourceSelect')
const AudioOscilloscope = require('./audio-oscilloscope')
const SubmitButton = require('./SubmitButton')
const DiscardButton = require('./DiscardButton')

class CameraScreen extends Component {
  componentDidMount () {
    this.initAudioOscilloscope()
  }

  componentDidUpdate () {
    const { src, recordedAudio, isRecording } = this.props
    const hasRecordedAudio = !!recordedAudio

    if (hasRecordedAudio) {
      this.oscilloscope = null
    }

    if (!hasRecordedAudio && !isRecording && src) {
      this.initAudioOscilloscope()
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(src)
      this.oscilloscope.addSource(source)
    }
  }

  componentWillUnmount () {
    const { onStop } = this.props
    this.oscilloscope = null
    onStop()
  }

  initAudioOscilloscope () {
    this.oscilloscope = new AudioOscilloscope(this.canvasElement, {
      canvas: {
        width: () => {
          return window.innerWidth
        },
        height: 400,
      },
      canvasContext: {
        lineWidth: 2,
        fillStyle: 'rgb(0,0,0)',
        strokeStyle: 'green',
      },
    })
    this.oscilloscope.draw()
  }

  render () {
    const {
      recordedAudio,
      recording,
      supportsRecording,
      audioSources,
      showAudioSourceDropdown,
      onSubmit,
      i18n,
      onStartRecording,
      onStopRecording,
      onDiscardRecordedAudio,
      recordingLengthSeconds,
    } = this.props

    const hasRecordedAudio = !!recordedAudio
    const shouldShowRecordButton = !hasRecordedAudio && supportsRecording
    const shouldShowAudioSourceDropdown = showAudioSourceDropdown
      && !hasRecordedAudio
      && audioSources
      && audioSources.length > 1

    return (
      <div className="uppy-Audio-container">
        <div className="uppy-Audio-audioContainer">
          {hasRecordedAudio
            ? (
              <audio
                /* eslint-disable-next-line no-return-assign */
                ref={(audioElement) => (this.audioElement = audioElement)}
                className="uppy-Audio-player"
                /* eslint-disable-next-line react/jsx-props-no-spreading */
                controls
                src={recordedAudio}
              />
            ) : (
              <canvas
                /* eslint-disable-next-line no-return-assign */
                ref={(canvasElement) => (this.canvasElement = canvasElement)}
                className="uppy-Audio-canvas"
              />
            )}
        </div>
        <div className="uppy-Audio-footer">
          <div className="uppy-Audio-audioSourceContainer">
            {shouldShowAudioSourceDropdown
              ? AudioSourceSelect(this.props)
              : null}
          </div>
          <div className="uppy-Audio-buttonContainer">
            {shouldShowRecordButton && (
              <RecordButton
                recording={recording}
                onStartRecording={onStartRecording}
                onStopRecording={onStopRecording}
                i18n={i18n}
              />
            )}

            {hasRecordedAudio && <SubmitButton onSubmit={onSubmit} i18n={i18n} />}

            {hasRecordedAudio && <DiscardButton onDiscard={onDiscardRecordedAudio} i18n={i18n} />}
          </div>

          <div className="uppy-Audio-recordingLength">
            {!hasRecordedAudio && (
              <RecordingLength recordingLengthSeconds={recordingLengthSeconds} i18n={i18n} />
            )}
          </div>
        </div>
      </div>
    )
  }
}

module.exports = CameraScreen
