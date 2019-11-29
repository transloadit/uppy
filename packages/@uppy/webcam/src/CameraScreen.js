const { h, Component } = require('preact')
const SnapshotButton = require('./SnapshotButton')
const RecordButton = require('./RecordButton')
const RecordingLength = require('./RecordingLength')

function isModeAvailable (modes, mode) {
  return modes.indexOf(mode) !== -1
}

class CameraScreen extends Component {
  componentDidMount () {
    this.props.onFocus()
  }

  componentWillUnmount () {
    this.props.onStop()
  }

  render () {
    const shouldShowRecordButton = this.props.supportsRecording && (
      isModeAvailable(this.props.modes, 'video-only') ||
      isModeAvailable(this.props.modes, 'audio-only') ||
      isModeAvailable(this.props.modes, 'video-audio')
    )
    const shouldShowSnapshotButton = isModeAvailable(this.props.modes, 'picture')
    const shouldShowRecordingLength = this.props.supportsRecording && this.props.showRecordingLength

    return (
      <div class="uppy uppy-Webcam-container">
        <div class="uppy-Webcam-videoContainer">
          <video class={`uppy-Webcam-video  ${this.props.mirror ? 'uppy-Webcam-video--mirrored' : ''}`} autoplay muted playsinline srcObject={this.props.src || ''} />
        </div>
        <div class="uppy-Webcam-buttonContainer">
          {shouldShowRecordingLength ? RecordingLength(this.props) : null}
          {' '}
          {shouldShowSnapshotButton ? SnapshotButton(this.props) : null}
          {' '}
          {shouldShowRecordButton ? RecordButton(this.props) : null}
        </div>
      </div>
    )
  }
}

module.exports = CameraScreen
