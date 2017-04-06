const html = require('yo-yo')
const SnapshotButton = require('./SnapshotButton')
const RecordButton = require('./RecordButton')

function isModeAvailable (modes, mode) {
  return modes.indexOf(mode) !== -1
}

module.exports = (props) => {
  const src = props.src || ''
  let video

  if (props.useTheFlash) {
    video = props.getSWFHTML()
  } else {
    video = html`<video class="UppyWebcam-video" autoplay src="${src}"></video>`
  }

  const shouldShowRecordButton = props.supportsRecording && (
    isModeAvailable(props.modes, 'video-only') ||
    isModeAvailable(props.modes, 'audio-only') ||
    isModeAvailable(props.modes, 'video-audio')
  )

  const shouldShowSnapshotButton = isModeAvailable(props.modes, 'picture')

  return html`
    <div class="UppyWebcam-container" onload=${(el) => {
      props.onFocus()
      document.querySelector('.UppyWebcam-recordButton').focus()
    }} onunload=${(el) => {
      props.onStop()
    }}>
      <div class='UppyWebcam-videoContainer'>
        ${video}
      </div>
      <div class='UppyWebcam-buttonContainer'>
        ${shouldShowRecordButton ? RecordButton(props) : null}
        ${shouldShowSnapshotButton ? SnapshotButton(props) : null}
      </div>
      <canvas class="UppyWebcam-canvas" style="display: none;"></canvas>
    </div>
  `
}
