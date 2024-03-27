import { h } from 'preact'
import type { I18n } from '@uppy/utils/lib/Translator'

export default function Loader({
  i18n,
  loading,
}: {
  i18n: I18n
  loading: string | boolean
}): JSX.Element {
  return (
    <div className="uppy-Provider-loading">
      <span>{i18n('loading')}</span>
      {typeof loading === 'string' && ( // todo improve this, see discussion in https://github.com/transloadit/uppy/pull/4399#discussion_r1162564445
        <span style={{ marginTop: '.7em' }}>{loading}</span>
      )}
    </div>
  )
}
