const FileItem = require('./FileItem/index.js')
const VirtualList = require('preact-virtual-list')
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

  // 190px height + 2 * 5px margin
  const rowHeight = 200

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
    removeFile: props.removeFile
  }

  const rows = chunks(Object.keys(props.files), props.itemsPerRow)

  function renderRow (row, index) {
    return (
      <div role="presentation">
        {row.map((fileID) => (
          <FileItem
            key={fileID}
            {...fileProps}
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
