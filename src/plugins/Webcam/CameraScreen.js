import html from '../../core/html'

export default (props) => {
  return html`
    <div>
      <div class='UppyWebcam-videoContainer'>
        <video class='UppyWebcam-video' autoplay></video>
      </div>
      <div class='UppyWebcam-buttonContainer'>
        <button class="UppyButton--circular UppyButton--blue UppyButton--sizeM UppyDashboard-upload"
          type="button"
          title="Take a snapshot"
          aria-label="Take a snapshot"
          onclick=${this.takeSnapshot}>
          ${this.snapshotIcon}
        </button>
      </div>
      <canvas class='UppyWebcam-canvas'></canvas>
    </div>
  `
}
