const FileItem = require('./FileItem/index.js')
const classNames = require('classnames')
const { h } = require('preact')

module.exports = (props) => {
  const dashboardFilesClass = classNames({
    'uppy-Dashboard-files': true,
    'uppy-Dashboard-files--noFiles': props.totalFileCount === 0
  })

  const fileProps = {
    // FIXME This is confusing, it's actually the Dashboard's plugin ID
    id: props.id,
    error: props.error,
    // TODO move this to context
    i18n: props.i18n,
    log: props.log,
    info: props.info,
    // features
    acquirers: props.acquirers,
    resumableUploads: props.resumableUploads,
    individualCancellation: props.individualCancellation,
    // visual options
    hideRetryButton: props.hideRetryButton,
    hidePauseResumeCancelButtons: props.hidePauseResumeCancelButtons,
    showLinkToFileUploadResult: props.showLinkToFileUploadResult,
    isWide: props.isWide,
    metaFields: props.metaFields,
    // callbacks
    retryUpload: props.retryUpload,
    pauseUpload: props.pauseUpload,
    cancelUpload: props.cancelUpload,
    toggleFileCard: props.toggleFileCard,
    removeFile: props.removeFile,
    handleRequestThumbnail: props.handleRequestThumbnail
  }

  function renderItem (fileID) {
    return (
      <FileItem
        key={fileID}
        {...fileProps}
        file={props.files[fileID]}
      />
    )
  }

  return (
    <ul class={dashboardFilesClass}>
      {Object.keys(props.files).map(renderItem)}
    </ul>
  )
}
