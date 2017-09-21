const { h, Component } = require('preact')
const hyperx = require('hyperx')
const html = hyperx(h, {attrToProp: false})

const SnapshotButton = require('./SnapshotButton')
const RecordButton = require('./RecordButton')

function isModeAvailable (modes, mode) {
  return modes.indexOf(mode) !== -1
}

class CameraScreen extends Component {
  componentDidMount () {
    this.props.onFocus()
    const recordButton = this.webcamContainer.querySelector('.UppyWebcam-recordButton')
    if (recordButton) recordButton.focus()
  }

  componentWillUnmount () {
    this.props.onStop()
  }

  render () {
    const src = this.props.src || ''
    let video

    if (this.props.useTheFlash) {
      video = this.props.getSWFHTML()
    } else {
      video = html`<video class="UppyWebcam-video" autoplay muted src="${src}"></video>`
    }

    const shouldShowRecordButton = this.props.supportsRecording && (
      isModeAvailable(this.props.modes, 'video-only') ||
      isModeAvailable(this.props.modes, 'audio-only') ||
      isModeAvailable(this.props.modes, 'video-audio')
    )

    const shouldShowSnapshotButton = isModeAvailable(this.props.modes, 'picture')

    return html`
      <div class="UppyWebcam-container" ref=${(el) => {
        console.log(el)
        this.webcamContainer = el
      }}>
        <div class='UppyWebcam-videoContainer'>
          ${video}
        </div>
        <div class='UppyWebcam-buttonContainer'>
          ${shouldShowRecordButton ? RecordButton(this.props) : null}
          ${shouldShowSnapshotButton ? SnapshotButton(this.props) : null}
        </div>
        <canvas class="UppyWebcam-canvas" style="display: none;"></canvas>
      </div>
    `
  }
}

module.exports = CameraScreen
