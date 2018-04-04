const { h } = require('preact')
const CameraIcon = require('./CameraIcon')

module.exports = ({ onSnapshot }) => {
  return (
    <button class="uppy-u-reset uppy-c-btn uppy-Webcam-button uppy-Webcam-button--picture"
      type="button"
      title="Take a snapshot"
      aria-label="Take a snapshot"
      onclick={onSnapshot}>
      {CameraIcon()}
    </button>
  )
}
