import type { Body, Meta } from '@uppy/core'
import { Component, type ComponentChild, Fragment, h } from 'preact'
import DiscardButton from './DiscardButton.js'
import RecordButton from './RecordButton.js'
import type ScreenCapture from './ScreenCapture.js'
import type { ScreenCaptureState } from './ScreenCapture.js'
import ScreenshotButton from './ScreenshotButton.js'
import StopWatch from './StopWatch.js'
import StreamStatus from './StreamStatus.js'
import SubmitButton from './SubmitButton.js'

type RecorderScreenProps<M extends Meta, B extends Body> = {
  onStartRecording: ScreenCapture<M, B>['startRecording']
  onStopRecording: ScreenCapture<M, B>['stopRecording']
  onStop: ScreenCapture<M, B>['stop']
  onSubmit: ScreenCapture<M, B>['submit']
  i18n: ScreenCapture<M, B>['i18n']
  stream: ScreenCapture<M, B>['videoStream']
  onScreenshot: ScreenCapture<M, B>['captureScreenshot']
  enableScreenshots: boolean
  capturedScreenshotUrl: ScreenCaptureState['capturedScreenshotUrl']
  onDiscard: ScreenCapture<M, B>['discardRecordedMedia']
} & ScreenCaptureState

class RecorderScreen<M extends Meta, B extends Body> extends Component<
  RecorderScreenProps<M, B>
> {
  videoElement: HTMLVideoElement | null = null

  componentWillUnmount(): void {
    const { onStop } = this.props
    onStop()
  }

  render(): ComponentChild {
    const {
      recording,
      stream: videoStream,
      recordedVideo,
      enableScreenshots,
      capturedScreenshotUrl,
    } = this.props

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
        <div className="uppy-ScreenCapture-mediaContainer">
          <StreamStatus {...this.props} />
          {capturedScreenshotUrl && !recording && !recordedVideo ? (
            <div className="uppy-ScreenCapture-imageContainer">
              <img
                src={capturedScreenshotUrl}
                className="uppy-ScreenCapture-media"
                alt="screenshotPreview"
              />
            </div>
          ) : (
            <video
              ref={(videoElement) => {
                this.videoElement = videoElement
              }}
              className="uppy-ScreenCapture-media"
              {...videoProps}
            />
          )}
          <div>
            <StopWatch {...this.props} />
          </div>
        </div>

        <div className="uppy-ScreenCapture-buttonContainer">
          {recordedVideo || capturedScreenshotUrl ? (
            <Fragment>
              <SubmitButton {...this.props} />
              <DiscardButton {...this.props} />
            </Fragment>
          ) : (
            <Fragment>
              {enableScreenshots && !recording && (
                <ScreenshotButton {...this.props} />
              )}
              <RecordButton {...this.props} />
            </Fragment>
          )}
        </div>
      </div>
    )
  }
}

export default RecorderScreen
