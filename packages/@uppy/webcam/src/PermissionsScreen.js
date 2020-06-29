const { h } = require('preact')

module.exports = (props) => {
  return (
    <div class="uppy-Webcam-permissons">
      <div class="uppy-Webcam-permissonsIcon">{props.icon()}</div>
      <h1 class="uppy-Webcam-title">{props.hasCamera ? props.i18n('allowAccessTitle') : props.i18n('noCameraTitle')}</h1>
      <p>{props.hasCamera ? props.i18n('allowAccessDescription') : props.i18n('noCameraDescription')}</p>
    </div>
  )
}
