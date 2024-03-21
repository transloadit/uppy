import { h, type ComponentChild } from 'preact'
import FilePreview from '../../FilePreview.tsx'
import MetaErrorMessage from '../MetaErrorMessage.tsx'
import getFileTypeIcon from '../../../utils/getFileTypeIcon.tsx'

type $TSFixMe = any

export default function FilePreviewAndLink(props: $TSFixMe): ComponentChild {
  const { file, i18n, toggleFileCard, metaFields, showLinkToFileUploadResult } =
    props
  const white = 'rgba(255, 255, 255, 0.5)'
  const previewBackgroundColor =
    file.preview ? white : getFileTypeIcon(file.type).color

  return (
    <div
      className="uppy-Dashboard-Item-previewInnerWrap"
      style={{ backgroundColor: previewBackgroundColor }}
    >
      {showLinkToFileUploadResult && file.uploadURL && (
        <a
          className="uppy-Dashboard-Item-previewLink"
          href={file.uploadURL}
          rel="noreferrer noopener"
          target="_blank"
          aria-label={file.meta.name}
        >
          <span hidden>{file.meta.name}</span>
        </a>
      )}
      <FilePreview file={file} />
      <MetaErrorMessage
        file={file}
        i18n={i18n}
        toggleFileCard={toggleFileCard}
        metaFields={metaFields}
      />
    </div>
  )
}
