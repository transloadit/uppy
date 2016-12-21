const html = require('yo-yo')
const CameraIcon = require('./CameraIcon')

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
      document.querySelector('.UppyWebcam-stopRecordBtn').focus()
    }} onunload=${(el) => {
      props.onStop()
    }}>
      <div class='UppyWebcam-videoContainer'>
        ${video}
      </div>
      <div class='UppyWebcam-buttonContainer'>
        <button class="UppyButton--circular UppyButton--red UppyButton--sizeM UppyWebcam-stopRecordBtn"
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
