import { h } from 'preact'

export default ({ icon, i18n, hasCamera }) => {
  return (
    <div className="uppy-Webcam-permissons">
      <div className="uppy-Webcam-permissonsIcon">{icon()}</div>
      <h1 className="uppy-Webcam-title">{hasCamera ? i18n('allowAccessTitle') : i18n('noCameraTitle')}</h1>
      <p>{hasCamera ? i18n('allowAccessDescription') : i18n('noCameraDescription')}</p>
    </div>
  )
}
