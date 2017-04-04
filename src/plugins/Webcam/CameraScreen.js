const html = require('yo-yo')
const CameraIcon = require('./CameraIcon')
const RecordStartIcon = require('./RecordStartIcon')
const RecordStopIcon = require('./RecordStopIcon')

function RecordButton ({ recording, onStartRecording, onStopRecording }) {
  if (recording) {
    return html`
      <button class="UppyButton--circular UppyButton--red UppyButton--sizeM UppyWebcam-recordButton"
        type="button"
        title="Stop Recording"
        aria-label="Stop Recording"
        onclick=${onStopRecording}>
        ${RecordStopIcon()}
      </button>
    `
  }

  return html`
    <button class="UppyButton--circular UppyButton--red UppyButton--sizeM UppyWebcam-recordButton"
      type="button"
      title="Begin Recording"
      aria-label="Begin Recording"
      onclick=${onStartRecording}>
      ${RecordStartIcon()}
    </button>
  `
}

module.exports = (props) => {
  const src = props.src || ''
  let video

  if (props.useTheFlash) {
    video = props.getSWFHTML()
  } else {
    video = html`<video class="UppyWebcam-video" autoplay src="${src}"></video>`
  }

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
        ${RecordButton(props)}
        <button class="UppyButton--circular UppyButton--red UppyButton--sizeM UppyWebcam-recordButton"
          type="button"
          title="Take a snapshot"
          aria-label="Take a snapshot"
          onclick=${props.onSnapshot}>
          ${CameraIcon()}
        </button>
      </div>
      <canvas class="UppyWebcam-canvas" style="display: none;"></canvas>
    </div>
  `
}
