import type { I18n } from '@uppy/utils/lib/Translator'
import { h } from 'preact'
import CameraIcon from './CameraIcon.js'

interface SnapshotButtonProps {
  onSnapshot: () => void
  i18n: I18n
}

export default function SnapshotButton({
  onSnapshot,
  i18n,
}: SnapshotButtonProps) {
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
