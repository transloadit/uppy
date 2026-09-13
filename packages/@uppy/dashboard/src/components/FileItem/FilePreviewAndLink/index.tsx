import type { Body, I18n, Meta, UppyFile } from '@uppy/core/utils'
import type { DashboardState } from '../../../Dashboard.js'
import getFileTypeIcon from '../../../utils/getFileTypeIcon.js'
import FilePreview from '../../FilePreview.js'
import MetaErrorMessage from '../MetaErrorMessage.js'

interface FilePreviewAndLinkProps<M extends Meta, B extends Body> {
  i18n: I18n
  file: UppyFile<M, B>
  metaFields: DashboardState<M, B>['metaFields']
  showLinkToFileUploadResult: boolean
  toggleFileCard: (show: boolean, fileId: string) => void
}

export default function FilePreviewAndLink<M extends Meta, B extends Body>(
  props: FilePreviewAndLinkProps<M, B>,
) {
  const { file, i18n, toggleFileCard, metaFields, showLinkToFileUploadResult } =
    props
  const white = 'rgba(255, 255, 255, 0.5)'
  const previewBackgroundColor = file.preview
    ? white
    : getFileTypeIcon(file.type).color

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
