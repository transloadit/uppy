import { h } from 'preact'
import CameraIcon from './CameraIcon.jsx'

export default ({ onSnapshot, i18n }) => {
  return (
    <button
      className="uppy-u-reset uppy-c-btn uppy-Webcam-button uppy-Webcam-button--picture"
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
