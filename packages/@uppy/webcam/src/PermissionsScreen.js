const { h } = require('preact')

module.exports = (props) => {
  return (
    <div className="uppy-Webcam-permissons">
      <div className="uppy-Webcam-permissonsIcon">{props.icon()}</div>
      <h1 className="uppy-Webcam-title">{props.hasCamera ? props.i18n('allowAccessTitle') : props.i18n('noCameraTitle')}</h1>
      <p>{props.hasCamera ? props.i18n('allowAccessDescription') : props.i18n('noCameraDescription')}</p>
    </div>
  )
}
