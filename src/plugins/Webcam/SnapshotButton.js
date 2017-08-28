const { h } = require('preact')
const hyperx = require('hyperx')
const html = hyperx(h, {attrToProp: false})

const CameraIcon = require('./CameraIcon')

module.exports = function SnapshotButton ({ onSnapshot }) {
  return html`
    <button class="UppyButton--circular UppyButton--red UppyButton--sizeM UppyWebcam-recordButton"
      type="button"
      title="Take a snapshot"
      aria-label="Take a snapshot"
      onclick=${onSnapshot}>
      ${CameraIcon()}
    </button>
  `
}
