const { h } = require('preact')
const CameraIcon = require('./CameraIcon')

module.exports = ({ onSnapshot }) => {
  return (
    <button class="UppyButton--circular UppyButton--red UppyButton--sizeM uppy-Webcam-recordButton"
      type="button"
      title="Take a snapshot"
      aria-label="Take a snapshot"
      onclick={onSnapshot}>
      {CameraIcon()}
    </button>
  )
}
