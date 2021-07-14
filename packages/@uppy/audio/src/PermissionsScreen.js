const { h } = require('preact')

module.exports = (props) => {
  return (
    <div className="uppy-Audio-permissons">
      <div className="uppy-Audio-permissonsIcon">{props.icon()}</div>
      <h1 className="uppy-Audio-title">{props.hasCamera ? props.i18n('allowAccessTitle') : props.i18n('noCameraTitle')}</h1>
      <p>{props.hasCamera ? props.i18n('allowAccessDescription') : props.i18n('noCameraDescription')}</p>
    </div>
  )
}
