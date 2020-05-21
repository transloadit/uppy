const { h } = require('preact')
const copyToClipboard = require('../../../utils/copyToClipboard')

const { iconPencil, iconCross, iconCopyLink } = require('../../icons')

function EditButton ({
  file,
  uploadInProgressOrComplete,
  metaFields,
  i18n,
  onClick
}) {
  if (!uploadInProgressOrComplete &&
      metaFields &&
      metaFields.length > 0) {
    return (
      <button
        class="uppy-u-reset uppy-DashboardItem-action uppy-DashboardItem-action--edit"
        type="button"
        aria-label={i18n('editFile') + ' ' + file.meta.name}
        title={i18n('editFile')}
        onclick={() => onClick()}
      >
        {iconPencil()}
      </button>
    )
  }
  return null
}

function RemoveButton ({ i18n, onClick }) {
  return (
    <button
      class="uppy-u-reset uppy-DashboardItem-action uppy-DashboardItem-action--remove"
      type="button"
      aria-label={i18n('removeFile')}
      title={i18n('removeFile')}
      onclick={() => onClick()}
    >
      {iconCross()}
    </button>
  )
}

const copyLinkToClipboard = (event, props) => {
  copyToClipboard(props.file.uploadURL, props.i18n('copyLinkToClipboardFallback'))
    .then(() => {
      props.log('Link copied to clipboard.')
      props.info(props.i18n('copyLinkToClipboardSuccess'), 'info', 3000)
    })
    .catch(props.log)
    // avoid losing focus
    .then(() => event.target.focus({ preventScroll: true }))
}

function CopyLinkButton (props) {
  return (
    <button
      class="uppy-u-reset uppy-DashboardItem-action uppy-DashboardItem-action--copyLink"
      type="button"
      aria-label={props.i18n('copyLink')}
      title={props.i18n('copyLink')}
      onclick={(event) => copyLinkToClipboard(event, props)}
    >
      {iconCopyLink()}
    </button>
  )
}

function ErrorButton ({ file, onClick }) {
  if (file.error) {
    return (
      <span
        class="uppy-DashboardItem-errorDetails"
        aria-label={file.error}
        data-microtip-position="bottom-left"
        data-microtip-size="medium"
        role="tooltip"
        onclick={onClick}
      >
        ?
      </span>
    )
  }
  return null
}

module.exports = function Buttons (props) {
  const {
    file,
    uploadInProgressOrComplete,
    metaFields,
    showLinkToFileUploadResult,
    showRemoveButton,
    i18n,
    removeFile,
    toggleFileCard,
    log,
    info
  } = props

  return (
    <div className="uppy-DashboardItem-actionWrapper">
      <ErrorButton
        file={file}
        onClick={() => {
          alert(file.error)
        }}
      />
      <EditButton
        i18n={i18n}
        file={file}
        uploadInProgressOrComplete={uploadInProgressOrComplete}
        metaFields={metaFields}
        onClick={() => toggleFileCard(file.id)}
      />
      {showLinkToFileUploadResult && file.uploadURL ? (
        <CopyLinkButton
          file={file}
          i18n={i18n}
          info={info}
          log={log}
        />
      ) : null}
      {showRemoveButton ? (
        <RemoveButton
          i18n={i18n}
          info={props.info}
          log={props.log}
          onClick={() => removeFile(file.id)}
        />
      ) : null}
    </div>
  )
}
