/* eslint-disable jsx-a11y/media-has-caption */
const { h, Component } = require('preact')
const RecordButton = require('./RecordButton')
const RecordingLength = require('./RecordingLength')
const VideoSourceSelect = require('./VideoSourceSelect')
const SubmitButton = require('./SubmitButton')
const DiscardButton = require('./DiscardButton')

class CameraScreen extends Component {
  componentWillUnmount () {
    const { onStop } = this.props
    onStop()
  }

  render () {
    const {
      src,
      recordedVideo,
      recording,
      supportsRecording,
      videoSources,
      showVideoSourceDropdown,
      showRecordingLength,
      onSubmit,
      i18n,
      onStartRecording,
      onStopRecording,
      onDiscardRecordedVideo,
      recordingLengthSeconds,
    } = this.props

    const hasRecordedVideo = !!recordedVideo
    const shouldShowRecordButton = !hasRecordedVideo && supportsRecording

    const shouldShowRecordingLength = supportsRecording && showRecordingLength
    const shouldShowVideoSourceDropdown = showVideoSourceDropdown && videoSources && videoSources.length > 1

    const videoProps = {
      playsinline: true,
    }

    if (recordedVideo) {
      videoProps.controls = true
      videoProps.src = recordedVideo

      // reset srcObject in dom. If not resetted, stream sticks in element
      if (this.videoElement) {
        this.videoElement.srcObject = undefined
      }
    } else {
      videoProps.srcObject = src
    }

    return (
      <div className="uppy uppy-Audio-container">
        <div className="uppy-Audio-videoContainer">
          {hasRecordedVideo
            ? (
              <audio
                /* eslint-disable-next-line no-return-assign */
                ref={(videoElement) => (this.videoElement = videoElement)}
                className="uppy-Audio-video"
                /* eslint-disable-next-line react/jsx-props-no-spreading */
                {...videoProps}
              />
            )
            : 'Recording...'}
        </div>
        <div className="uppy-Audio-footer">
          <div className="uppy-Audio-videoSourceContainer">
            {shouldShowVideoSourceDropdown
              ? VideoSourceSelect(this.props)
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

            {hasRecordedVideo && <SubmitButton onSubmit={onSubmit} i18n={i18n} />}

            {hasRecordedVideo && <DiscardButton onDiscard={onDiscardRecordedVideo} i18n={i18n} />}
          </div>

          {shouldShowRecordingLength && (
            <div className="uppy-Audio-recordingLength">
              <RecordingLength recordingLengthSeconds={recordingLengthSeconds} i18n={i18n} />
            </div>
          )}
        </div>
      </div>
    )
  }
}

module.exports = CameraScreen
