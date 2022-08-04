/* eslint-disable react/jsx-props-no-spreading */
import { h, Component } from 'preact'
import RecordButton from './RecordButton.jsx'
import SubmitButton from './SubmitButton.jsx'
import StopWatch from './StopWatch.jsx'
import StreamStatus from './StreamStatus.jsx'

class RecorderScreen extends Component {
  componentWillUnmount () {
    const { onStop } = this.props
    onStop()
  }

  render () {
    const { recording, stream: videoStream, recordedVideo } = this.props

    const videoProps = {
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
        this.videoElement.srcObject = undefined
      }
    }

    return (
      <div className="uppy uppy-ScreenCapture-container">
        <div className="uppy-ScreenCapture-videoContainer">
          <StreamStatus {...this.props} />
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoElement => { this.videoElement = videoElement }} className="uppy-ScreenCapture-video" {...videoProps} />
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
