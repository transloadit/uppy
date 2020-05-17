const getFileTypeIcon = require('../utils/getFileTypeIcon')
const { h } = require('preact')

module.exports = function FilePreview (props) {
  const file = props.file

  const fileTypeGeneral = file.type.split('/')[0]
  if (fileTypeGeneral === 'video' && file.data) {
    const fileDataUrl = URL.createObjectURL(file.data)
    return (
      <video controls autoPlay class="uppy-DashboardItem-previewVideo">
        <source src={fileDataUrl} />
        Video preview is not supported in your browser
      </video>
    )
  } else if (file.preview) {
    return <img class="uppy-DashboardItem-previewImg" alt={file.name} src={file.preview} />
  }

  const { color, icon } = getFileTypeIcon(file.type)

  return (
    <div class="uppy-DashboardItem-previewIconWrap">
      <span class="uppy-DashboardItem-previewIcon" style={{ color: color }}>{icon}</span>
      <svg aria-hidden="true" focusable="false" class="uppy-DashboardItem-previewIconBg" width="58" height="76" viewBox="0 0 58 76"><rect fill="#FFF" width="58" height="76" rx="3" fill-rule="evenodd" /></svg>
    </div>
  )
}
