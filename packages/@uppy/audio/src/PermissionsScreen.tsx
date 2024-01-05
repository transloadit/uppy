import { h } from 'preact'

export default (props) => {
  const { icon, hasAudio, i18n } = props
  return (
    <div className="uppy-Audio-permissons">
      <div className="uppy-Audio-permissonsIcon">{icon()}</div>
      <h1 className="uppy-Audio-title">{hasAudio ? i18n('allowAudioAccessTitle') : i18n('noAudioTitle')}</h1>
      <p>{hasAudio ? i18n('allowAudioAccessDescription') : i18n('noAudioDescription')}</p>
    </div>
  )
}
