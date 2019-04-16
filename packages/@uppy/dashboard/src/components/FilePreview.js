const getFileTypeIcon = require('../utils/getFileTypeIcon')
const { h } = require('preact')

module.exports = function FilePreview (props) {
  const file = props.file

  if (file.preview) {
    return <img class="uppy-DashboardItem-previewImg" alt={file.name} src={file.preview} />
  }

  const { color, icon } = getFileTypeIcon(file.type)

  return (
    <div class="uppy-DashboardItem-previewIconWrap">
      <span class="uppy-DashboardItem-previewIcon" style={{ color: color }}>{icon}</span>
      <svg class="uppy-DashboardItem-previewIconBg" width="54" height="71" viewBox="0 0 54 71"><rect fill="#FFF" width="54" height="71" rx="3" fill-rule="evenodd" /></svg>
    </div>
  )
}
