const getFileTypeIcon = require('../utils/getFileTypeIcon')
const { h } = require('preact')

module.exports = function FilePreview (props) {
  const file = props.file

  if (file.preview) {
    return (
      <img
        class="uppy-Dashboard-Item-previewImg"
        alt={file.name}
        src={file.preview}
      />
    )
  }

  const { color, icon } = getFileTypeIcon(file.type)

  return (
    <div class="uppy-Dashboard-Item-previewIconWrap">
      <span class="uppy-Dashboard-Item-previewIcon" style={{ color: color }}>{icon}</span>
      <svg aria-hidden="true" focusable="false" class="uppy-Dashboard-Item-previewIconBg" width="58" height="76" viewBox="0 0 58 76">
        <rect fill="#FFF" width="58" height="76" rx="3" fill-rule="evenodd" />
      </svg>
    </div>
  )
}
