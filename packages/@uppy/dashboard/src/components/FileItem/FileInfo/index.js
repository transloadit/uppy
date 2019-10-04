const { h } = require('preact')
const prettyBytes = require('@uppy/utils/lib/prettyBytes')
const truncateString = require('../../../utils/truncateString')

const renderAcquirerIcon = (acquirer, props) =>
  <span title={props.i18n('fileSource', { name: acquirer.name })}>
    {acquirer.icon()}
  </span>

const renderFileSource = (props) => (
  props.file.source &&
  props.file.source !== props.id &&
    <div class="uppy-DashboardItem-sourceIcon">
      {props.acquirers.map(acquirer => {
        if (acquirer.id === props.file.source) {
          return renderAcquirerIcon(acquirer, props)
        }
      })}
    </div>
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
    <div class="uppy-DashboardItem-name" title={props.file.meta.name}>
      {truncateString(props.file.meta.name, maxNameLength)}
    </div>
  )
}

const renderFileSize = (props) => (
  props.file.data.size &&
    <div class="uppy-DashboardItem-statusSize">
      {prettyBytes(props.file.data.size)}
    </div>
)

module.exports = function FileInfo (props) {
  return (
    <div class="uppy-DashboardItem-fileInfo" data-uppy-file-source={props.file.source}>
      {renderFileName(props)}
      <div class="uppy-DashboardItem-status">
        {renderFileSize(props)}
        {renderFileSource(props)}
      </div>
    </div>
  )
}
