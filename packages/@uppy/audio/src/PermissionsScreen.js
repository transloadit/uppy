const { h } = require('preact')

module.exports = (props) => {
  const { icon, hasAudio, i18n } = props
  return (
    <div className="uppy-Audio-permissons">
      <div className="uppy-Audio-permissonsIcon">{icon()}</div>
      <h1 className="uppy-Audio-title">{hasAudio ? i18n('allowAccessTitleAudio') : i18n('noAudioTitle')}</h1>
      <p>{hasAudio ? i18n('allowAccessDescriptionAudio') : i18n('noAudioDescriptionAudio')}</p>
    </div>
  )
}
