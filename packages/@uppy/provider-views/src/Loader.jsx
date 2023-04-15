import { h } from 'preact'

export default ({ i18n, loading }) => {
  return (
    <div className="uppy-Provider-loading">
      <span>{i18n('loading')}</span>
      {typeof loading === 'string' && ( // todo improve this, see discussion in https://github.com/transloadit/uppy/pull/4399#discussion_r1162564445
        <span style={{ marginTop: '.7em' }}>{loading}</span>
      )}
    </div>
  )
}
