import { h } from 'preact'
import FileItem from './FileItem/index.jsx'
import VirtualList from './VirtualList.jsx'

function chunks (list, size) {
  const chunked = []
  let currentChunk = []
  list.forEach((item) => {
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

export default (props) => {
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
    uppy: props.uppy,
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
    recoveredState: props.recoveredState,
    singleFile: props.singleFile,
    // callbacks
    toggleFileCard: props.toggleFileCard,
    handleRequestThumbnail: props.handleRequestThumbnail,
    handleCancelThumbnail: props.handleCancelThumbnail,
  }

  const sortByGhostComesFirst = (file1, file2) => {
    return props.files[file2].isGhost - props.files[file1].isGhost
  }

  // Sort files by file.isGhost, ghost files first, only if recoveredState is present
  const files = Object.keys(props.files)
  if (props.recoveredState) files.sort(sortByGhostComesFirst)
  const rows = chunks(files, props.itemsPerRow)

  const renderRow = (row) => (
    // The `role="presentation` attribute ensures that the list items are properly
    // associated with the `VirtualList` element.
    // We use the first file ID as the key—this should not change across scroll rerenders
    <div class="uppy-Dashboard-filesInner" role="presentation" key={row[0]}>
      {row.map((fileID) => (
        <FileItem
          key={fileID}
          uppy={props.uppy}
          {...fileProps} // eslint-disable-line react/jsx-props-no-spreading
          role="listitem"
          openFileEditor={props.openFileEditor}
          canEditFile={props.canEditFile}
          toggleAddFilesPanel={props.toggleAddFilesPanel}
          file={props.files[fileID]}
        />
      ))}
    </div>
  )

  if (props.singleFile) {
    return (
      <div class="uppy-Dashboard-files">
        {renderRow(rows[0])}
      </div>
    )
  }

  return (
    <VirtualList
      class="uppy-Dashboard-files"
      role="list"
      data={rows}
      renderRow={renderRow}
      rowHeight={rowHeight}
    />
  )
}
