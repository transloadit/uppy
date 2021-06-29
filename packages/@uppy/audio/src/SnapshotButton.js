const { h } = require('preact')
const CameraIcon = require('./CameraIcon')

module.exports = ({ onSnapshot, i18n }) => {
  return (
    <button
      className="uppy-u-reset uppy-c-btn uppy-Audio-button uppy-Audio-button--picture"
      type="button"
      title={i18n('takePicture')}
      aria-label={i18n('takePicture')}
      onClick={onSnapshot}
      data-uppy-super-focusable
    >
      {CameraIcon()}
    </button>
  )
}
