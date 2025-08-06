import type { I18n } from '@uppy/utils/lib/Translator'
import { Component, type ComponentChild, type ComponentProps, h } from 'preact'
import DiscardButton from './DiscardButton.js'
import RecordButton from './RecordButton.js'
import RecordingLength from './RecordingLength.js'
import SnapshotButton from './SnapshotButton.js'
import SubmitButton from './SubmitButton.js'
import VideoSourceSelect, {
  type VideoSourceSelectProps,
} from './VideoSourceSelect.js'

function isModeAvailable<T>(modes: T[], mode: any): mode is T {
  return modes.includes(mode)
}

interface CameraScreenProps extends VideoSourceSelectProps {
  onFocus: () => void
  onStop: () => void

  src: MediaStream | null
  recording: boolean
  recordedVideo: string | null
  capturedSnapshot: string | null
  modes: string[]
  supportsRecording: boolean
  showVideoSourceDropdown: boolean
  showRecordingLength: boolean
  onSubmit: () => void
  i18n: I18n
  mirror: boolean
  onSnapshot: () => void
  onStartRecording: () => void
  onStopRecording: () => void
  onDiscardRecordedMedia: () => void
  recordingLengthSeconds: number
}

class CameraScreen extends Component<CameraScreenProps> {
  private videoElement?: HTMLVideoElement

  refs: any

  componentDidMount(): void {
    const { onFocus } = this.props
    onFocus()
  }

  componentWillUnmount(): void {
    const { onStop } = this.props
    onStop()
  }

  render(): ComponentChild {
    const {
      src,
      recordedVideo,
      capturedSnapshot,
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
      onDiscardRecordedMedia,
      recordingLengthSeconds,
    } = this.props

    const hasRecordedVideo = !!recordedVideo
    const hasCapturedSnapshot = !!capturedSnapshot
    const hasRecordedMedia = hasRecordedVideo || hasCapturedSnapshot
    const shouldShowRecordButton =
      !hasRecordedMedia &&
      supportsRecording &&
      (isModeAvailable(modes, 'video-only') ||
        isModeAvailable(modes, 'audio-only') ||
        isModeAvailable(modes, 'video-audio'))
    const shouldShowSnapshotButton =
      !hasRecordedMedia && isModeAvailable(modes, 'picture')
    const shouldShowRecordingLength =
      supportsRecording && showRecordingLength && !hasRecordedVideo
    const shouldShowVideoSourceDropdown =
      showVideoSourceDropdown && videoSources && videoSources.length > 1

    const videoProps: ComponentProps<'video'> = {
      playsInline: true,
    }

    if (recordedVideo) {
      videoProps.muted = false
      videoProps.controls = true
      videoProps.src = recordedVideo

      // reset srcObject in dom. If not resetted, stream sticks in element
      if (this.videoElement) {
        this.videoElement.srcObject = null
      }
    } else {
      videoProps.muted = true
      videoProps.autoPlay = true
      videoProps.srcObject = src
    }
    return (
      <div className="uppy uppy-Webcam-container">
        <div className="uppy-Webcam-videoContainer">
          {capturedSnapshot && !recording && !recordedVideo ? (
            <div className="uppy-Webcam-imageContainer">
              <img
                src={capturedSnapshot}
                className="uppy-Webcam-video"
                alt="capturedSnapshot"
              />
            </div>
          ) : (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              /* eslint-disable-next-line no-return-assign */
              ref={(videoElement) => (this.videoElement = videoElement!)}
              className={`uppy-Webcam-video  ${
                mirror ? 'uppy-Webcam-video--mirrored' : ''
              }`}
              /* eslint-disable-next-line react/jsx-props-no-spreading */
              {...videoProps}
            />
          )}
        </div>
        <div className="uppy-Webcam-footer">
          <div className="uppy-Webcam-videoSourceContainer">
            {shouldShowVideoSourceDropdown
              ? VideoSourceSelect(this.props)
              : null}
          </div>
          <div className="uppy-Webcam-buttonContainer">
            {shouldShowSnapshotButton && (
              <SnapshotButton onSnapshot={onSnapshot} i18n={i18n} />
            )}

            {shouldShowRecordButton && (
              <RecordButton
                recording={recording}
                onStartRecording={onStartRecording}
                onStopRecording={onStopRecording}
                i18n={i18n}
              />
            )}

            {(hasRecordedVideo || hasCapturedSnapshot) && (
              <SubmitButton onSubmit={onSubmit} i18n={i18n} />
            )}

            {(hasRecordedVideo || hasCapturedSnapshot) && (
              <DiscardButton onDiscard={onDiscardRecordedMedia} i18n={i18n} />
            )}
          </div>

          <div className="uppy-Webcam-recordingLength">
            {shouldShowRecordingLength && (
              <RecordingLength
                recordingLengthSeconds={recordingLengthSeconds}
              />
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default CameraScreen
