const { h } = require('preact')

const renderAcquirerIcon = (acquirer, props) =>
  <span title={props.i18n('fileSource', { name: acquirer.name })}>
    {acquirer.icon()}
  </span>

module.exports = function FileSource (props) {
  return (
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
}
