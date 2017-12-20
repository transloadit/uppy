const { h, Component } = require('preact')
const SnapshotButton = require('./SnapshotButton')
const RecordButton = require('./RecordButton')

function isModeAvailable (modes, mode) {
  return modes.indexOf(mode) !== -1
}

class CameraScreen extends Component {
  componentDidMount () {
    this.props.onFocus()
    this.btnContainer.firstChild.focus()
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

    return (
      <div class="UppyWebcam-container">
        <div class="UppyWebcam-videoContainer">
          <video class="UppyWebcam-video" autoplay muted src={this.props.src || ''} />
        </div>
        <div class="UppyWebcam-buttonContainer" ref={(el) => { this.btnContainer = el }}>
          {shouldShowSnapshotButton ? SnapshotButton(this.props) : null}
          {' '}
          {shouldShowRecordButton ? RecordButton(this.props) : null}
        </div>
        <canvas class="UppyWebcam-canvas" style="display: none;" />
      </div>
    )
  }
}

module.exports = CameraScreen
