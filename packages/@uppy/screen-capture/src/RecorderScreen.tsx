/* eslint-disable react/jsx-props-no-spreading */
import { h, Component, type ComponentChild } from 'preact'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import RecordButton from './RecordButton.tsx'
import SubmitButton from './SubmitButton.tsx'
import StopWatch from './StopWatch.tsx'
import StreamStatus from './StreamStatus.tsx'

import ScreenCapture, { type ScreenCaptureState } from './ScreenCapture.tsx'

type RecorderScreenProps<M extends Meta, B extends Body> = {
  onStartRecording: ScreenCapture<M, B>['startRecording']
  onStopRecording: ScreenCapture<M, B>['stopRecording']
  onStop: ScreenCapture<M, B>['stop']
  onSubmit: ScreenCapture<M, B>['submit']
  i18n: ScreenCapture<M, B>['i18n']
  stream: ScreenCapture<M, B>['videoStream']
} & ScreenCaptureState

class RecorderScreen<M extends Meta, B extends Body> extends Component<
  RecorderScreenProps<M, B>
> {
  videoElement: HTMLVideoElement | null

  componentWillUnmount(): void {
    const { onStop } = this.props
    onStop()
  }

  render(): ComponentChild {
    const { recording, stream: videoStream, recordedVideo } = this.props

    const videoProps: {
      muted?: boolean
      autoplay?: boolean
      playsinline?: boolean
      controls?: boolean
      src?: string
      srcObject?: MediaStream | null
    } = {
      playsinline: true,
    }

    // show stream
    if (recording || (!recordedVideo && !recording)) {
      videoProps.muted = true
      videoProps.autoplay = true
      videoProps.srcObject = videoStream
    }

    // show preview
    if (recordedVideo && !recording) {
      videoProps.muted = false
      videoProps.controls = true
      videoProps.src = recordedVideo

      // reset srcObject in dom. If not resetted, stream sticks in element
      if (this.videoElement) {
        this.videoElement.srcObject = null
      }
    }

    return (
      <div className="uppy uppy-ScreenCapture-container">
        <div className="uppy-ScreenCapture-videoContainer">
          <StreamStatus {...this.props} />
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={(videoElement) => {
              this.videoElement = videoElement
            }}
            className="uppy-ScreenCapture-video"
            {...videoProps}
          />
          <StopWatch {...this.props} />
        </div>

        <div className="uppy-ScreenCapture-buttonContainer">
          <RecordButton {...this.props} />
          <SubmitButton {...this.props} />
        </div>
      </div>
    )
  }
}

export default RecorderScreen
