import type { Body, Meta, State, Uppy, UppyFile } from '@uppy/core'
import type { I18n } from '@uppy/utils/lib/Translator'
// @ts-ignore untyped
import VirtualList from '@uppy/utils/lib/VirtualList'
import { h } from 'preact'
import { useMemo } from 'preact/hooks'
import type { DashboardState } from '../Dashboard.js'
import FileItem from './FileItem/index.js'

type FileListProps<M extends Meta, B extends Body> = {
  id: string
  i18n: I18n
  uppy: Uppy<M, B>
  files: State<M, B>['files']
  resumableUploads: boolean
  hideRetryButton: boolean
  hidePauseResumeButton: boolean
  hideCancelButton: boolean
  showLinkToFileUploadResult: boolean
  showRemoveButtonAfterComplete: boolean
  metaFields: DashboardState<M, B>['metaFields']
  isSingleFile: boolean
  toggleFileCard: (show: boolean, fileId: string) => void
  handleRequestThumbnail: (file: UppyFile<M, B>) => void
  handleCancelThumbnail: (file: UppyFile<M, B>) => void
  recoveredState: State<M, B>['recoveredState']
  individualCancellation: boolean
  itemsPerRow: number
  openFileEditor: (file: UppyFile<M, B>) => void
  canEditFile: (file: UppyFile<M, B>) => boolean
  toggleAddFilesPanel: (show: boolean) => void
  containerWidth: number
  containerHeight: number
}

function chunks<T>(list: T[], size: number): T[][] {
  const chunked: T[][] = []
  let currentChunk: T[] = []
  list.forEach((item: T) => {
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

export default function FileList<M extends Meta, B extends Body>({
  id,
  i18n,
  uppy,
  files,
  resumableUploads,
  hideRetryButton,
  hidePauseResumeButton,
  hideCancelButton,
  showLinkToFileUploadResult,
  showRemoveButtonAfterComplete,
  metaFields,
  isSingleFile,
  toggleFileCard,
  handleRequestThumbnail,
  handleCancelThumbnail,
  recoveredState,
  individualCancellation,
  itemsPerRow,
  openFileEditor,
  canEditFile,
  toggleAddFilesPanel,
  containerWidth,
  containerHeight,
}: FileListProps<M, B>) {
  // It's not great that this is hardcoded!
  // It's ESPECIALLY not great that this is checking against `itemsPerRow`!
  const rowHeight =
    itemsPerRow === 1
      ? // Mobile
        71
      : // 190px height + 2 * 5px margin
        200

  // Sort files by file.isGhost, ghost files first, only if recoveredState is present
  const rows = useMemo(() => {
    const sortByGhostComesFirst = (file1: string, file2: string) =>
      Number(files[file2].isGhost) - Number(files[file1].isGhost)

    const fileIds = Object.keys(files)
    if (recoveredState) fileIds.sort(sortByGhostComesFirst)
    return chunks(fileIds, itemsPerRow)
  }, [files, itemsPerRow, recoveredState])

  const renderRow = (row: string[]) => (
    <div
      class="uppy-Dashboard-filesInner"
      // The `role="presentation` attribute ensures that the list items are properly
      // associated with the `VirtualList` element.
      role="presentation"
      // We use the first file ID as the key — this should not change across scroll rerenders.
      key={row[0]}
    >
      {row.map((fileID: string) => (
        <FileItem
          key={fileID}
          uppy={uppy}
          // FIXME This is confusing, it's actually the Dashboard's plugin ID
          id={id}
          // TODO move this to context
          i18n={i18n}
          // features
          resumableUploads={resumableUploads}
          individualCancellation={individualCancellation}
          // visual options
          hideRetryButton={hideRetryButton}
          hidePauseResumeButton={hidePauseResumeButton}
          hideCancelButton={hideCancelButton}
          showLinkToFileUploadResult={showLinkToFileUploadResult}
          showRemoveButtonAfterComplete={showRemoveButtonAfterComplete}
          metaFields={metaFields}
          recoveredState={recoveredState}
          isSingleFile={isSingleFile}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
          // callbacks
          toggleFileCard={toggleFileCard}
          handleRequestThumbnail={handleRequestThumbnail}
          handleCancelThumbnail={handleCancelThumbnail}
          role="listitem"
          openFileEditor={openFileEditor}
          canEditFile={canEditFile}
          toggleAddFilesPanel={toggleAddFilesPanel}
          file={files[fileID]}
        />
      ))}
    </div>
  )

  if (isSingleFile) {
    return <div class="uppy-Dashboard-files">{renderRow(rows[0])}</div>
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
