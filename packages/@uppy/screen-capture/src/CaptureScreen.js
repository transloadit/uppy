const { h, Component } = require('preact')
const RecordButton = require('./RecordButton')
const SubmitButton = require('./SubmitButton')
const StopWatch = require('./StopWatch')
const StreamStatus = require('./StreamStatus')

class RecorderScreen extends Component {
  componentWillUnmount () {
    this.props.onStop()
  }

  render () {
    const { recording, stream: videoStream, recordedVideo } = this.props

    const videoProps = {
      playsinline: true
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
      <div class="uppy uppy-ScreenCapture-container">
        <div class="uppy-ScreenCapture-videoContainer">
          <StreamStatus {...this.props} />
          <video ref={videoElement => (this.videoElement = videoElement)} class="uppy-ScreenCapture-video" {...videoProps} />
          <StopWatch {...this.props} />
        </div>

        <div class="uppy-ScreenCapture-buttonContainer">
          <RecordButton {...this.props} />
          <SubmitButton {...this.props} />
        </div>
      </div>
    )
  }
}

module.exports = RecorderScreen
