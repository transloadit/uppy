import { h } from 'preact'
import FilePreview from '../../FilePreview.jsx'
import MetaErrorMessage from '../MetaErrorMessage.jsx'
import getFileTypeIcon from '../../../utils/getFileTypeIcon.jsx'

export default function FilePreviewAndLink (props) {
  return (
    <div
      className="uppy-Dashboard-Item-previewInnerWrap"
      style={{ backgroundColor: getFileTypeIcon(props.file.type).color }}
    >
      {
        props.showLinkToFileUploadResult
        && props.file.uploadURL
          && (
          <a
            className="uppy-Dashboard-Item-previewLink"
            href={props.file.uploadURL}
            rel="noreferrer noopener"
            target="_blank"
            aria-label={props.file.meta.name}
          >
            <span hidden>{props.file.meta.name}</span>
          </a>
          )
      }
      <FilePreview file={props.file} />
      <MetaErrorMessage
        file={props.file}
        i18n={props.i18n}
        toggleFileCard={props.toggleFileCard}
        metaFields={props.metaFields}
      />
    </div>
  )
}
