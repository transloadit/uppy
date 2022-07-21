/* eslint-disable jsx-a11y/media-has-caption */
import { h, Component } from 'preact'
import SnapshotButton from './SnapshotButton.jsx'
import RecordButton from './RecordButton.jsx'
import RecordingLength from './RecordingLength.jsx'
import VideoSourceSelect from './VideoSourceSelect.jsx'
import SubmitButton from './SubmitButton.jsx'
import DiscardButton from './DiscardButton.jsx'

function isModeAvailable (modes, mode) {
  return modes.includes(mode)
}

class CameraScreen extends Component {
  componentDidMount () {
    const { onFocus } = this.props
    onFocus()
  }

  componentWillUnmount () {
    const { onStop } = this.props
    onStop()
  }

  render () {
    const {
      src,
      recordedVideo,
      recording,
      modes,
      supportsRecording,
      videoSources,
      showVideoSourceDropdown,
      showRecordingLength,
      onSubmit,
      i18n,
      mirror,
      onSnapshot,
      onStartRecording,
      onStopRecording,
      onDiscardRecordedVideo,
      recordingLengthSeconds,
    } = this.props

    const hasRecordedVideo = !!recordedVideo
    const shouldShowRecordButton = !hasRecordedVideo && supportsRecording && (
      isModeAvailable(modes, 'video-only')
      || isModeAvailable(modes, 'audio-only')
      || isModeAvailable(modes, 'video-audio')
    )
    const shouldShowSnapshotButton = !hasRecordedVideo && isModeAvailable(modes, 'picture')
    const shouldShowRecordingLength = supportsRecording && showRecordingLength && !hasRecordedVideo
    const shouldShowVideoSourceDropdown = showVideoSourceDropdown && videoSources && videoSources.length > 1

    const videoProps = {
      playsinline: true,
    }

    if (recordedVideo) {
      videoProps.muted = false
      videoProps.controls = true
      videoProps.src = recordedVideo

      // reset srcObject in dom. If not resetted, stream sticks in element
      if (this.videoElement) {
        this.videoElement.srcObject = undefined
      }
    } else {
      videoProps.muted = true
      videoProps.autoplay = true
      videoProps.srcObject = src
    }

    return (
      <div className="uppy uppy-Webcam-container">
        <div className="uppy-Webcam-videoContainer">
          <video
            /* eslint-disable-next-line no-return-assign */
            ref={(videoElement) => (this.videoElement = videoElement)}
            className={`uppy-Webcam-video  ${mirror ? 'uppy-Webcam-video--mirrored' : ''}`}
            /* eslint-disable-next-line react/jsx-props-no-spreading */
            {...videoProps}
          />
        </div>
        <div className="uppy-Webcam-footer">
          <div className="uppy-Webcam-videoSourceContainer">
            {shouldShowVideoSourceDropdown
              ? VideoSourceSelect(this.props)
              : null}
          </div>
          <div className="uppy-Webcam-buttonContainer">
            {shouldShowSnapshotButton && <SnapshotButton onSnapshot={onSnapshot} i18n={i18n} />}

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

          <div className="uppy-Webcam-recordingLength">
            {shouldShowRecordingLength && (
              <RecordingLength recordingLengthSeconds={recordingLengthSeconds} i18n={i18n} />
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default CameraScreen
