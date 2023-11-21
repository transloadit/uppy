import { h } from 'preact'
import FilePreview from '../../FilePreview.jsx'
import MetaErrorMessage from '../MetaErrorMessage.jsx'
import getFileTypeIcon from '../../../utils/getFileTypeIcon.jsx'
const getYouTubeID = require('get-youtube-id');

function matchYoutubeUrl(url) {
  var p = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
  if (url.match(p)) {
    return url.match(p)[1];
  }
  return false;
}

export default function FilePreviewAndLink (props) {
  const { file, i18n, toggleFileCard, metaFields, showLinkToFileUploadResult } = props
  const white = 'rgba(255, 255, 255, 0.5)'
  const previewBackgroundColor = file.preview ? white : getFileTypeIcon(props.file.type).color
  let thumbnail = false
  const url = props?.file?.remote?.body?.url
  if (url && matchYoutubeUrl(url)) {
    const videoID = getYouTubeID(url, { fuzzy: false });
    thumbnail = `https://img.youtube.com/vi/${videoID}/default.jpg`
  }

  return (
    <div
      className="uppy-Dashboard-Item-previewInnerWrap"
      style={{ backgroundColor: previewBackgroundColor }}
    >
      {
        showLinkToFileUploadResult && file.uploadURL
          && (
          <a
            className="uppy-Dashboard-Item-previewLink"
            href={file.uploadURL}
            rel="noreferrer noopener"
            target="_blank"
            aria-label={file.meta.name}
          >
            <span hidden>{file.meta.name}</span>
          </a>
          )
      }
      {
        !thumbnail &&
        <FilePreview file={file} />
      }
      <MetaErrorMessage
        file={file}
        i18n={i18n}
        toggleFileCard={toggleFileCard}
        metaFields={metaFields}
      />
    </div>
  )
}