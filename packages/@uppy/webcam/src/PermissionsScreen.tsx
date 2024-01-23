import type { I18n } from '@uppy/utils/lib/Translator'
import { h } from 'preact'

interface PermissionScreenProps {
  hasCamera: boolean
  icon: () => JSX.Element | null
  i18n: I18n
}

// TODO: name that function
export default ({
  icon,
  i18n,
  hasCamera,
}: PermissionScreenProps): JSX.Element => {
  return (
    <div className="uppy-Webcam-permissons">
      <div className="uppy-Webcam-permissonsIcon">{icon()}</div>
      <h1 className="uppy-Webcam-title">
        {hasCamera ? i18n('allowAccessTitle') : i18n('noCameraTitle')}
      </h1>
      <p>
        {hasCamera
          ? i18n('allowAccessDescription')
          : i18n('noCameraDescription')}
      </p>
    </div>
  )
}
