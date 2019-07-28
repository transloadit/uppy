const { h } = require('preact')

module.exports = (props) => {
  return (
    <div class="uppy-Capture-permissons">
      <div class="uppy-Capture-permissonsIcon">{props.icon()}</div>
      <h1 class="uppy-Capture-title">{props.i18n('allowAccessTitle')}</h1>
      <p>{props.i18n('allowAccessDescription')}</p>
    </div>
  )
}
