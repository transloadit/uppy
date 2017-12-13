const { h, Component } = require('preact')
const hyperx = require('hyperx')
const html = hyperx(h)
const SnapshotButton = require('./SnapshotButton')
const RecordButton = require('./RecordButton')

function isModeAvailable (modes, mode) {
  return modes.indexOf(mode) !== -1
}

class CameraScreen extends Component {
  constructor (props) {
    super(props)
    this.src = this.props.src || ''
    this.shouldShowRecordButton = this.props.supportsRecording && (
      isModeAvailable(this.props.modes, 'video-only') ||
      isModeAvailable(this.props.modes, 'audio-only') ||
      isModeAvailable(this.props.modes, 'video-audio')
    )
    this.shouldShowSnapshotButton = isModeAvailable(this.props.modes, 'picture')
  }

  componentDidMount () {
    this.props.onFocus()
    // const recordButton = el.querySelector('.UppyWebcam-recordButton')
    // if (recordButton) recordButton.focus()
  }

  componentWillUnmount () {
    this.props.onStop()
  }

  render () {
    return html`
      <div class="UppyWebcam-container">
        <div class="UppyWebcam-videoContainer">
          <video class="UppyWebcam-video" autoplay muted src="${this.src}"></video>
        </div>
        <div class="UppyWebcam-buttonContainer">
          ${this.shouldShowSnapshotButton ? SnapshotButton(this.props) : null}
          ${this.shouldShowRecordButton ? RecordButton(this.props) : null}
        </div>
        <canvas class="UppyWebcam-canvas" style="display: none;"></canvas>
      </div>
    `
  }
}

module.exports = CameraScreen
