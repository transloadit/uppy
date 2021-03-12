const FileItem = require('./FileItem/index.js')
const VirtualList = require('./VirtualList')
const classNames = require('classnames')
const { h } = require('preact')

function chunks (list, size) {
  const chunked = []
  let currentChunk = []
  list.forEach((item, i) => {
    if (currentChunk.length < size) {
      currentChunk.push(item)
    } else {
      chunked.push(currentChunk)
      currentChunk = [item]
    }
  })
  if (currentChunk.length) chunked.push(currentChunk)
  return chunked
}

module.exports = (props) => {
  const noFiles = props.totalFileCount === 0
  const dashboardFilesClass = classNames(
    'uppy-Dashboard-files',
    { 'uppy-Dashboard-files--noFiles': noFiles }
  )

  // It's not great that this is hardcoded!
  // It's ESPECIALLY not great that this is checking against `itemsPerRow`!
  const rowHeight = props.itemsPerRow === 1
    // Mobile
    ? 71
    // 190px height + 2 * 5px margin
    : 200

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
    hidePauseResumeButton: props.hidePauseResumeButton,
    hideCancelButton: props.hideCancelButton,
    showLinkToFileUploadResult: props.showLinkToFileUploadResult,
    showRemoveButtonAfterComplete: props.showRemoveButtonAfterComplete,
    isWide: props.isWide,
    metaFields: props.metaFields,
    // callbacks
    retryUpload: props.retryUpload,
    pauseUpload: props.pauseUpload,
    cancelUpload: props.cancelUpload,
    toggleFileCard: props.toggleFileCard,
    removeFile: props.removeFile,
    handleRequestThumbnail: props.handleRequestThumbnail,
    handleCancelThumbnail: props.handleCancelThumbnail
  }

  const rows = chunks(Object.keys(props.files), props.itemsPerRow)

  function renderRow (row) {
    return (
      // The `role="presentation` attribute ensures that the list items are properly associated with the `VirtualList` element
      // We use the first file ID as the key—this should not change across scroll rerenders
      <div role="presentation" key={row[0]}>
        {row.map((fileID) => (
          <FileItem
            key={fileID}
            {...fileProps}
            role="listitem"
            openFileEditor={props.openFileEditor}
            canEditFile={props.canEditFile}
            file={props.files[fileID]}
          />
        ))}
      </div>
    )
  }

  return (
    <VirtualList
      class={dashboardFilesClass}
      role="list"
      data={rows}
      renderRow={renderRow}
      rowHeight={rowHeight}
    />
  )
}
