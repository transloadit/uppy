import html from '../../core/html'
import CameraIcon from './CameraIcon'

export default (props) => {
  let video

  if (props.useTheFlash) {
    video = props.getSWFHTML()
  } else {
    video = html`<video class='UppyWebcam-video' autoplay src=${props.src}></video>`
  }

  return html`
    <div>
      <div class='UppyWebcam-videoContainer'>
        ${video}
      </div>
      <div class='UppyWebcam-buttonContainer'>
        <button class="UppyButton--circular UppyButton--blue UppyButton--sizeM UppyDashboard-upload"
          type="button"
          title="Take a snapshot"
          aria-label="Take a snapshot"
          onclick=${props.onSnapshot}>
          ${CameraIcon()}
        </button>
      </div>
      <canvas class='UppyWebcam-canvas'></canvas>
    </div>
  `
}
