const { h, Fragment } = require('preact')
const prettierBytes = require('@transloadit/prettier-bytes')
const truncateString = require('@uppy/utils/lib/truncateString')
const MetaErrorMessage = require('../MetaErrorMessage')

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
          {` ${dot} `}
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
        className="uppy-u-reset uppy-Dashboard-Item-errorDetails"
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
  const { file } = props
  return (
    <div
      className="uppy-Dashboard-Item-fileInfo"
      data-uppy-file-source={file.source}
    >
      <div className="uppy-Dashboard-Item-fileName">
        {renderFileName(props)}
        <ErrorButton
          file={props.file}
          // eslint-disable-next-line no-alert
          onClick={() => alert(props.file.error)} // TODO: move to a custom alert implementation
        />
      </div>
      <div className="uppy-Dashboard-Item-status">
        {renderAuthor(props)}
        {renderFileSize(props)}
        {ReSelectButton(props)}
      </div>
      <MetaErrorMessage
        file={props.file}
        i18n={props.i18n}
        toggleFileCard={props.toggleFileCard}
        metaFields={props.metaFields}
      />
    </div>
  )
}
