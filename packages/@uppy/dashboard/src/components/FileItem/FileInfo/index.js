const { h, Fragment } = require('preact')
const prettierBytes = require('@transloadit/prettier-bytes')
const truncateString = require('@uppy/utils/lib/truncateString')

const renderFileName = (props) => {
  const { author, name } = props.file.meta

  function getMaxNameLength () {
    if (props.containerWidth <= 352) {
      return 35
    }
    if (props.containerWidth <= 576) {
      return 60
    }
    // When `author` is present, we want to make sure
    // the file name fits on one line so we can place
    // the author on the second line.
    return author ? 20 : 30
  }

  return (
    <div className="uppy-Dashboard-Item-name" title={name}>
      {truncateString(name, getMaxNameLength())}
    </div>
  )
}

const renderAuthor = (props) => {
  const { author } = props.file.meta
  const { providerName } = props.file.remote
  const dot = `\u00B7`

  if (!author) {
    return null
  }

  return (
    <div className="uppy-Dashboard-Item-author">
      <a
        href={`${author.url}?utm_source=Companion&utm_medium=referral`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {truncateString(author.name, 13)}
      </a>
      {providerName ? (
        <Fragment>
          {` ${dot} `}
          {providerName}
        </Fragment>
      ) : null}
    </div>
  )
}

const renderFileSize = (props) => props.file.size && (
<div className="uppy-Dashboard-Item-statusSize">
  {prettierBytes(props.file.size)}
</div>
)

const ReSelectButton = (props) => props.file.isGhost && (
<span>
  {' \u2022 '}
  <button
    className="uppy-u-reset uppy-c-btn uppy-Dashboard-Item-reSelect"
    type="button"
    onClick={props.toggleAddFilesPanel}
  >
    {props.i18n('reSelect')}
  </button>
</span>
)

const ErrorButton = ({ file, onClick }) => {
  if (file.error) {
    return (
      <button
        className="uppy-Dashboard-Item-errorDetails"
        aria-label={file.error}
        data-microtip-position="bottom"
        data-microtip-size="medium"
        onClick={onClick}
        type="button"
      >
        ?
      </button>
    )
  }
  return null
}

module.exports = function FileInfo (props) {
  return (
    <div
      className="uppy-Dashboard-Item-fileInfo"
      data-uppy-file-source={props.file.source}
    >
      {renderFileName(props)}
      <div className="uppy-Dashboard-Item-status">
        {renderFileSize(props)}
        {renderAuthor(props)}
        {ReSelectButton(props)}
        <ErrorButton
          file={props.file}
          // eslint-disable-next-line no-alert
          onClick={() => alert(props.file.error)} // TODO: move to a custom alert implementation
        />
      </div>
    </div>
  )
}
