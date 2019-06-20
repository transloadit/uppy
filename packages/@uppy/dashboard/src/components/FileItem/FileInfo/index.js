const { h } = require('preact')
const prettyBytes = require('prettier-bytes')
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

const renderFileName = (props) =>
  <div class="uppy-DashboardItem-name">
    {truncateString(props.file.meta.name, props.currentWidth > 606 ? 35 : 60)}
  </div>

const renderFileSize = (props) => (
  props.file.data.size &&
  <div class="uppy-DashboardItem-statusSize">
    {prettyBytes(props.file.data.size)}
  </div>
)

module.exports = function FileInfo (props) {
  return (
    <div class="uppy-DashboardItem-fileInfo">
      {renderFileName(props)}
      <div class="uppy-DashboardItem-status">
        {renderFileSize(props)}
        {renderFileSource(props)}
      </div>
    </div>
  )
}
