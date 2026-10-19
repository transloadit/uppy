import type { Body, Meta, UppyFile } from '@uppy/core'
import type { ComponentChildren } from 'preact'
import getFileTypeIcon from '../utils/getFileTypeIcon.js'

interface FilePreviewProps<M extends Meta, B extends Body> {
  file: UppyFile<M, B>
}

export default function FilePreview<M extends Meta, B extends Body>(
  props: FilePreviewProps<M, B>,
): ComponentChildren {
  const { file } = props

  if (file.preview) {
    return (
      <img
        draggable={false}
        className="uppy-Dashboard-Item-previewImg"
        alt={file.name}
        src={file.preview}
      />
    )
  }

  const { color, icon } = getFileTypeIcon(file.type)

  return (
    <div className="uppy-Dashboard-Item-previewIconWrap">
      <span className="uppy-Dashboard-Item-previewIcon" style={{ color }}>
        {icon}
      </span>
      <svg
        aria-hidden="true"
        focusable="false"
        className="uppy-Dashboard-Item-previewIconBg"
        width="58"
        height="76"
        viewBox="0 0 58 76"
      >
        <rect fill="#FFF" width="58" height="76" rx="3" fillRule="evenodd" />
      </svg>
    </div>
  )
}
