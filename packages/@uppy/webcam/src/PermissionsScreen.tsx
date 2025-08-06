import type { I18n } from '@uppy/utils/lib/Translator'
import { type ComponentChild, h } from 'preact'

interface PermissionScreenProps {
  hasCamera: boolean
  icon: () => ComponentChild | null
  i18n: I18n
}

export default function PermissionsScreen({
  icon,
  i18n,
  hasCamera,
}: PermissionScreenProps) {
  return (
    <div className="uppy-Webcam-permissons">
      <div className="uppy-Webcam-permissonsIcon">{icon()}</div>
      <div className="uppy-Webcam-title">
        {hasCamera ? i18n('allowAccessTitle') : i18n('noCameraTitle')}
      </div>
      <p>
        {hasCamera
          ? i18n('allowAccessDescription')
          : i18n('noCameraDescription')}
      </p>
    </div>
  )
}
