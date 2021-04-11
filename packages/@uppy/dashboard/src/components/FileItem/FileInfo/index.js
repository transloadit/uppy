const { h } = require('preact')
const prettierBytes = require('@transloadit/prettier-bytes')
const truncateString = require('@uppy/utils/lib/truncateString')

const renderAcquirerIcon = (acquirer, props) => (
  <span title={props.i18n('fileSource', { name: acquirer.name })}>
    {acquirer.icon()}
  </span>
)

const renderFileSource = (props) => (
  props.file.source
  && props.file.source !== props.id
    && (
    <div className="uppy-Dashboard-Item-sourceIcon">
      {props.acquirers.map(acquirer => {
        if (acquirer.id === props.file.source) {
          return renderAcquirerIcon(acquirer, props)
        }
      })}
    </div>
    )
)

const renderFileName = (props) => {
  // Take up at most 2 lines on any screen
  let maxNameLength
  // For very small mobile screens
  if (props.containerWidth <= 352) {
    maxNameLength = 35
  // For regular mobile screens
  } else if (props.containerWidth <= 576) {
    maxNameLength = 60
  // For desktops
  } else {
    maxNameLength = 30
  }

  return (
    <div className="uppy-Dashboard-Item-name" title={props.file.meta.name}>
      {truncateString(props.file.meta.name, maxNameLength)}
    </div>
  )
}

const renderFileSize = (props) => (
  props.file.data.size
    && (
    <div className="uppy-Dashboard-Item-statusSize">
      {prettierBytes(props.file.data.size)}
    </div>
    )
)

const ErrorButton = ({ file, onClick }) => {
  if (file.error) {
    return (
      <span
        className="uppy-Dashboard-Item-errorDetails"
        aria-label={file.error}
        data-microtip-position="bottom"
        data-microtip-size="medium"
        role="tooltip"
        onClick={onClick}
      >
        ?
      </span>
    )
  }
  return null
}

module.exports = function FileInfo (props) {
  return (
    <div className="uppy-Dashboard-Item-fileInfo" data-uppy-file-source={props.file.source}>
      {renderFileName(props)}
      <div className="uppy-Dashboard-Item-status">
        {renderFileSize(props)}
        {renderFileSource(props)}
        <ErrorButton
          file={props.file}
          onClick={() => {
            alert(props.file.error)
          }}
        />
      </div>
    </div>
  )
}
