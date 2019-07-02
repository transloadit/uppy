const { h } = require('preact')
const copyToClipboard = require('../../../utils/copyToClipboard')

const { iconPencil, iconCross, iconCopyLink } = require('../../icons')

const renderEditButton = (props) => (
  !props.uploadInProgressOrComplete &&
  props.metaFields &&
  props.metaFields.length > 0 &&
  <button
    class="uppy-u-reset uppy-DashboardItem-action uppy-DashboardItem-action--edit"
    type="button"
    aria-label={props.i18n('editFile') + ' ' + props.file.meta.name}
    title={props.i18n('editFile')}
    onclick={(e) => props.toggleFileCard(props.file.id)}
  >
    {iconPencil()}
  </button>
)

const renderRemoveButton = (props) => (
  props.showRemoveButton &&
  <button
    class="uppy-u-reset uppy-DashboardItem-action uppy-DashboardItem-action--remove"
    type="button"
    aria-label={props.i18n('removeFile')}
    title={props.i18n('removeFile')}
    onclick={() => props.removeFile(props.file.id)}
  >
    {iconCross()}
  </button>
)

const copyLinkToClipboard = (event, props) =>
  copyToClipboard(props.file.uploadURL, props.i18n('copyLinkToClipboardFallback'))
    .then(() => {
      props.log('Link copied to clipboard.')
      props.info(props.i18n('copyLinkToClipboardSuccess'), 'info', 3000)
    })
    .catch(props.log)
    // avoid losing focus
    .then(() => event.target.focus({ preventScroll: true }))

const renderCopyLinkButton = (props) => (
  props.showLinkToFileUploadResult &&
  props.file.uploadURL &&
  <button class="uppy-u-reset uppy-DashboardItem-action uppy-DashboardItem-action--copyLink"
    type="button"
    aria-label={props.i18n('copyLink')}
    title={props.i18n('copyLink')}
    onclick={(event) => copyLinkToClipboard(event, props)}
  >
    {iconCopyLink()}
  </button>
)

module.exports = function Buttons (props) {
  return (
    <div className="uppy-DashboardItem-actionWrapper">
      {renderEditButton(props)}
      {renderCopyLinkButton(props)}
      {renderRemoveButton(props)}
    </div>
  )
}
