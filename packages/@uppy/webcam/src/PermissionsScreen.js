const { h } = require('preact')

module.exports = (props) => {
  return (
    <div class="uppy-Webcam-permissons">
      <div class="uppy-Webcam-permissonsIcon">{props.icon()}</div>
      <h1 class="uppy-Webcam-title">{props.i18n('allowAccessTitle')}</h1>
      <p>{props.i18n('allowAccessDescription')}</p>
    </div>
  )
}
