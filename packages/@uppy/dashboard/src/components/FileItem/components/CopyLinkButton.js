const { h } = require('preact')
const copyToClipboard = require('../../../utils/copyToClipboard')
const { iconCopyLink } = require('../../icons')

const copyLinkToClipboard = (event, props) =>
  copyToClipboard(props.file.uploadURL, props.i18n('copyLinkToClipboardFallback'))
    .then(() => {
      props.log('Link copied to clipboard.')
      props.info(props.i18n('copyLinkToClipboardSuccess'), 'info', 3000)
    })
    .catch(props.log)
    // avoid losing focus
    .then(() => event.target.focus({ preventScroll: true }))

module.exports = function CopyLinkButton (props) {
  return (
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
}
