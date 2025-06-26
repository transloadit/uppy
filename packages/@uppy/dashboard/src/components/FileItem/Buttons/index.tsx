import type Uppy from '@uppy/core'
import type { Body, Meta, UppyFile } from '@uppy/core'
import type { I18n } from '@uppy/utils/lib/Translator'
import { h } from 'preact'
import type { DashboardState } from '../../../Dashboard.js'
import copyToClipboard from '../../../utils/copyToClipboard.js'

type $TSFixMe = any

function EditButton<M extends Meta, B extends Body>({
  file,
  uploadInProgressOrComplete,
  metaFields,
  canEditFile,
  i18n,
  onClick,
}: {
  file: UppyFile<M, B>
  uploadInProgressOrComplete: boolean
  metaFields: DashboardState<M, B>['metaFields']
  canEditFile: (f: UppyFile<M, B>) => boolean
  i18n: I18n
  onClick: () => void
}) {
  if (
    (!uploadInProgressOrComplete && metaFields && metaFields.length > 0) ||
    (!uploadInProgressOrComplete && canEditFile(file))
  ) {
    return (
      <button
        className="uppy-u-reset uppy-c-btn uppy-Dashboard-Item-action uppy-Dashboard-Item-action--edit"
        type="button"
        aria-label={i18n('editFileWithFilename', { file: file.meta.name })}
        title={i18n('editFileWithFilename', { file: file.meta.name })}
        onClick={() => onClick()}
      >
        <svg
          aria-hidden="true"
          focusable="false"
          className="uppy-c-icon"
          width="14"
          height="14"
          viewBox="0 0 14 14"
        >
          <g fillRule="evenodd">
            <path
              d="M1.5 10.793h2.793A1 1 0 0 0 5 10.5L11.5 4a1 1 0 0 0 0-1.414L9.707.793a1 1 0 0 0-1.414 0l-6.5 6.5A1 1 0 0 0 1.5 8v2.793zm1-1V8L9 1.5l1.793 1.793-6.5 6.5H2.5z"
              fillRule="nonzero"
            />
            <rect x="1" y="12.293" width="11" height="1" rx=".5" />
            <path
              fillRule="nonzero"
              d="M6.793 2.5L9.5 5.207l.707-.707L7.5 1.793z"
            />
          </g>
        </svg>
      </button>
    )
  }
  return null
}

function RemoveButton<M extends Meta, B extends Body>({
  i18n,
  onClick,
  file,
}: {
  i18n: I18n
  onClick: () => void
  file: UppyFile<M, B>
}) {
  return (
    <button
      className="uppy-u-reset uppy-Dashboard-Item-action uppy-Dashboard-Item-action--remove"
      type="button"
      aria-label={i18n('removeFile', { file: file.meta.name })}
      title={i18n('removeFile', { file: file.meta.name })}
      onClick={() => onClick()}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        className="uppy-c-icon"
        width="18"
        height="18"
        viewBox="0 0 18 18"
      >
        <path d="M9 0C4.034 0 0 4.034 0 9s4.034 9 9 9 9-4.034 9-9-4.034-9-9-9z" />
        <path
          fill="#FFF"
          d="M13 12.222l-.778.778L9 9.778 5.778 13 5 12.222 8.222 9 5 5.778 5.778 5 9 8.222 12.222 5l.778.778L9.778 9z"
        />
      </svg>
    </button>
  )
}

function CopyLinkButton<M extends Meta, B extends Body>({
  file,
  uppy,
  i18n,
}: {
  file: UppyFile<M, B>
  uppy: Uppy<M, B>
  i18n: I18n
}) {
  const copyLinkToClipboard = (event: $TSFixMe) => {
    copyToClipboard(file.uploadURL, i18n('copyLinkToClipboardFallback'))
      .then(() => {
        uppy.log('Link copied to clipboard.')
        uppy.info(i18n('copyLinkToClipboardSuccess'), 'info', 3000)
      })
      .catch(uppy.log)
      // avoid losing focus
      .then(() => event.target.focus({ preventScroll: true }))
  }

  return (
    <button
      className="uppy-u-reset uppy-Dashboard-Item-action uppy-Dashboard-Item-action--copyLink"
      type="button"
      aria-label={i18n('copyLink')}
      title={i18n('copyLink')}
      onClick={(event) => copyLinkToClipboard(event)}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        className="uppy-c-icon"
        width="14"
        height="14"
        viewBox="0 0 14 12"
      >
        <path d="M7.94 7.703a2.613 2.613 0 0 1-.626 2.681l-.852.851a2.597 2.597 0 0 1-1.849.766A2.616 2.616 0 0 1 2.764 7.54l.852-.852a2.596 2.596 0 0 1 2.69-.625L5.267 7.099a1.44 1.44 0 0 0-.833.407l-.852.851a1.458 1.458 0 0 0 1.03 2.486c.39 0 .755-.152 1.03-.426l.852-.852c.231-.231.363-.522.406-.824l1.04-1.038zm4.295-5.937A2.596 2.596 0 0 0 10.387 1c-.698 0-1.355.272-1.849.766l-.852.851a2.614 2.614 0 0 0-.624 2.688l1.036-1.036c.041-.304.173-.6.407-.833l.852-.852c.275-.275.64-.426 1.03-.426a1.458 1.458 0 0 1 1.03 2.486l-.852.851a1.442 1.442 0 0 1-.824.406l-1.04 1.04a2.596 2.596 0 0 0 2.683-.628l.851-.85a2.616 2.616 0 0 0 0-3.697zm-6.88 6.883a.577.577 0 0 0 .82 0l3.474-3.474a.579.579 0 1 0-.819-.82L5.355 7.83a.579.579 0 0 0 0 .819z" />
      </svg>
    </button>
  )
}

type ButtonsProps<M extends Meta, B extends Body> = {
  uppy: Uppy<M, B>
  file: UppyFile<M, B>
  i18n: I18n
  uploadInProgressOrComplete: boolean
  canEditFile: (file: UppyFile<M, B>) => boolean
  metaFields: DashboardState<M, B>['metaFields']
  showLinkToFileUploadResult: boolean
  showRemoveButton: boolean
  toggleFileCard: (show: boolean, fileId: string) => void
  openFileEditor: (file: UppyFile<M, B>) => void
}

export default function Buttons<M extends Meta, B extends Body>(
  props: ButtonsProps<M, B>,
) {
  const {
    uppy,
    file,
    uploadInProgressOrComplete,
    canEditFile,
    metaFields,
    showLinkToFileUploadResult,
    showRemoveButton,
    i18n,
    toggleFileCard,
    openFileEditor,
  } = props
  const editAction = () => {
    if (metaFields && metaFields.length > 0) {
      toggleFileCard(true, file.id)
    } else {
      openFileEditor(file)
    }
  }

  return (
    <div className="uppy-Dashboard-Item-actionWrapper">
      <EditButton
        i18n={i18n}
        file={file}
        uploadInProgressOrComplete={uploadInProgressOrComplete}
        canEditFile={canEditFile}
        metaFields={metaFields}
        onClick={editAction}
      />
      {showLinkToFileUploadResult && file.uploadURL ? (
        <CopyLinkButton file={file} uppy={uppy} i18n={i18n} />
      ) : null}
      {showRemoveButton ? (
        <RemoveButton
          i18n={i18n}
          file={file}
          onClick={() => uppy.removeFile(file.id)}
        />
      ) : null}
    </div>
  )
}
