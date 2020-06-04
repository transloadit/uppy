const { h } = require('preact')
const FilePreview = require('../../FilePreview')
const getFileTypeIcon = require('../../../utils/getFileTypeIcon')

module.exports = function FilePreviewAndLink (props) {
  return (
    <div
      class="uppy-DashboardItem-previewInnerWrap"
      style={{ backgroundColor: getFileTypeIcon(props.file.type).color }}
    >
      {
        props.showLinkToFileUploadResult &&
        props.file.uploadURL &&
          <a
            class="uppy-DashboardItem-previewLink"
            href={props.file.uploadURL}
            rel="noreferrer noopener"
            target="_blank"
            aria-label={props.file.meta.name}
          />
      }
      <FilePreview file={props.file} />
    </div>
  )
}
