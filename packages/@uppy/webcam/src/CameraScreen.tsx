/* eslint-disable jsx-a11y/media-has-caption */
import type { I18n } from '@uppy/utils/lib/Translator'
import { h, Component, type ComponentChild } from 'preact'
import type { HTMLAttributes } from 'preact/compat'
import SnapshotButton from './SnapshotButton.tsx'
import RecordButton from './RecordButton.tsx'
import RecordingLength from './RecordingLength.tsx'
import VideoSourceSelect, {
  type VideoSourceSelectProps,
} from './VideoSourceSelect.tsx'
import SubmitButton from './SubmitButton.tsx'
import DiscardButton from './DiscardButton.tsx'

function isModeAvailable<T>(modes: T[], mode: any): mode is T {
  return modes.includes(mode)
}

interface CameraScreenProps extends VideoSourceSelectProps {
  onFocus: () => void
  onStop: () => void

  src: MediaStream | null
  recording: boolean
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
  onDiscardRecordedVideo: () => void
  recordingLengthSeconds: number
}

class CameraScreen extends Component<CameraScreenProps> {
  private videoElement: HTMLVideoElement

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
      // @ts-expect-error TODO: remove unused
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
    const shouldShowRecordButton =
      !hasRecordedVideo &&
      supportsRecording &&
      (isModeAvailable(modes, 'video-only') ||
        isModeAvailable(modes, 'audio-only') ||
        isModeAvailable(modes, 'video-audio'))
    const shouldShowSnapshotButton =
      !hasRecordedVideo && isModeAvailable(modes, 'picture')
    const shouldShowRecordingLength =
      supportsRecording && showRecordingLength && !hasRecordedVideo
    const shouldShowVideoSourceDropdown =
      showVideoSourceDropdown && videoSources && videoSources.length > 1

    const videoProps: HTMLAttributes<HTMLVideoElement> = {
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
      // @ts-expect-error srcObject does not exist on <video> props
      videoProps.srcObject = src
    }

    return (
      <div className="uppy uppy-Webcam-container">
        <div className="uppy-Webcam-videoContainer">
          <video
            /* eslint-disable-next-line no-return-assign */
            ref={(videoElement) => (this.videoElement = videoElement!)}
            className={`uppy-Webcam-video  ${
              mirror ? 'uppy-Webcam-video--mirrored' : ''
            }`}
            /* eslint-disable-next-line react/jsx-props-no-spreading */
            {...videoProps}
          />
        </div>
        <div className="uppy-Webcam-footer">
          <div className="uppy-Webcam-videoSourceContainer">
            {shouldShowVideoSourceDropdown ?
              VideoSourceSelect(this.props)
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

            {hasRecordedVideo && (
              <SubmitButton onSubmit={onSubmit} i18n={i18n} />
            )}

            {hasRecordedVideo && (
              <DiscardButton onDiscard={onDiscardRecordedVideo} i18n={i18n} />
            )}
          </div>

          <div className="uppy-Webcam-recordingLength">
            {shouldShowRecordingLength && (
              <RecordingLength
                recordingLengthSeconds={recordingLengthSeconds}
                i18n={i18n}
              />
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default CameraScreen
