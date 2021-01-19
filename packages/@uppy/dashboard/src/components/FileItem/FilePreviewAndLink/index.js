const { h } = require('preact')
const FilePreview = require('../../FilePreview')
const getFileTypeIcon = require('../../../utils/getFileTypeIcon')
const getYouTubeID = require('get-youtube-id');

function matchYoutubeUrl(url) {
  var p = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
  if (url.match(p)) {
    return url.match(p)[1];
  }
  return false;
}

module.exports = function FilePreviewAndLink(props) {
  let thumbnail = false
  const url = props?.file?.remote?.body?.url
  if (matchYoutubeUrl(url)) {
    const videoID = getYouTubeID(url, { fuzzy: false });
    thumbnail = `https://img.youtube.com/vi/${videoID}/default.jpg`
  }

  return (
    <div
      class="uppy-Dashboard-Item-previewInnerWrap"
      style={{ background: thumbnail ? `url(${thumbnail})` : getFileTypeIcon(props.file.type).color, backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: 'cover' }}
    >
      {
        props.showLinkToFileUploadResult &&
        props.file.uploadURL &&
        <a
          class="uppy-Dashboard-Item-previewLink"
          href={props.file.uploadURL}
          rel="noreferrer noopener"
          target="_blank"
          aria-label={props.file.meta.name}
        />
      }
      {
        !thumbnail &&
        <FilePreview file={props.file} />
      }

    </div>
  )
}