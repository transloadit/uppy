const getFileTypeIcon = require('./getFileTypeIcon')
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
      <svg class="uppy-DashboardItem-previewIconBg" width="72" height="93" viewBox="0 0 72 93"><g><path d="M24.08 5h38.922A2.997 2.997 0 0 1 66 8.003v74.994A2.997 2.997 0 0 1 63.004 86H8.996A2.998 2.998 0 0 1 6 83.01V22.234L24.08 5z" fill="#FFF" /><path d="M24 5L6 22.248h15.007A2.995 2.995 0 0 0 24 19.244V5z" fill="#E4E4E4" /></g></svg>
    </div>
  )
}

// <span class="uppy-DashboardItem-previewType">{file.extension && file.extension.length < 5 ? file.extension : null}</span>
