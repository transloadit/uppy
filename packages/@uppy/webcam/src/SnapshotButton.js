const { h } = require('preact')
const CameraIcon = require('./CameraIcon')

module.exports = ({ onSnapshot, i18n }) => {
  return (
    <button
      class="uppy-u-reset uppy-c-btn uppy-Webcam-button uppy-Webcam-button--picture"
      type="button"
      title={i18n('takePicture')}
      aria-label={i18n('takePicture')}
      onclick={onSnapshot}
      data-uppy-super-focusable
    >
      {CameraIcon()}
    </button>
  )
}
