// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck Typing this file requires more work, skipping it to unblock the rest of the transition.

/* eslint-disable react/destructuring-assignment */
import { h, Component, type ComponentChild } from 'preact'
import classNames from 'classnames'
import shallowEqual from 'is-shallow-equal'
import FilePreviewAndLink from './FilePreviewAndLink/index.tsx'
import FileProgress from './FileProgress/index.tsx'
import FileInfo from './FileInfo/index.tsx'
import Buttons from './Buttons/index.tsx'

type $TSFixMe = any

export default class FileItem extends Component {
  componentDidMount(): void {
    const { file } = this.props
    if (!file.preview) {
      this.props.handleRequestThumbnail(file)
    }
  }

  shouldComponentUpdate(nextProps: $TSFixMe): boolean {
    return !shallowEqual(this.props, nextProps)
  }

  // VirtualList mounts FileItems again and they emit `thumbnail:request`
  // Otherwise thumbnails are broken or missing after Golden Retriever restores files
  componentDidUpdate(): void {
    const { file } = this.props
    if (!file.preview) {
      this.props.handleRequestThumbnail(file)
    }
  }

  componentWillUnmount(): void {
    const { file } = this.props
    if (!file.preview) {
      this.props.handleCancelThumbnail(file)
    }
  }

  render(): ComponentChild {
    const { file } = this.props

    const isProcessing = file.progress.preprocess || file.progress.postprocess
    const isUploaded =
      file.progress.uploadComplete && !isProcessing && !file.error
    const uploadInProgressOrComplete =
      file.progress.uploadStarted || isProcessing
    const uploadInProgress =
      (file.progress.uploadStarted && !file.progress.uploadComplete) ||
      isProcessing
    const error = file.error || false

    // File that Golden Retriever was able to partly restore (only meta, not blob),
    // users still need to re-add it, so it’s a ghost
    const { isGhost } = file

    let showRemoveButton =
      this.props.individualCancellation ?
        !isUploaded
      : !uploadInProgress && !isUploaded

    if (isUploaded && this.props.showRemoveButtonAfterComplete) {
      showRemoveButton = true
    }

    const dashboardItemClass = classNames({
      'uppy-Dashboard-Item': true,
      'is-inprogress': uploadInProgress && !this.props.recoveredState,
      'is-processing': isProcessing,
      'is-complete': isUploaded,
      'is-error': !!error,
      'is-resumable': this.props.resumableUploads,
      'is-noIndividualCancellation': !this.props.individualCancellation,
      'is-ghost': isGhost,
    })

    return (
      <div
        className={dashboardItemClass}
        id={`uppy_${file.id}`}
        role={this.props.role}
      >
        <div className="uppy-Dashboard-Item-preview">
          <FilePreviewAndLink
            file={file}
            showLinkToFileUploadResult={this.props.showLinkToFileUploadResult}
            i18n={this.props.i18n}
            toggleFileCard={this.props.toggleFileCard}
            metaFields={this.props.metaFields}
          />
          <FileProgress
            uppy={this.props.uppy}
            file={file}
            error={error}
            isUploaded={isUploaded}
            hideRetryButton={this.props.hideRetryButton}
            hideCancelButton={this.props.hideCancelButton}
            hidePauseResumeButton={this.props.hidePauseResumeButton}
            recoveredState={this.props.recoveredState}
            showRemoveButtonAfterComplete={
              this.props.showRemoveButtonAfterComplete
            }
            resumableUploads={this.props.resumableUploads}
            individualCancellation={this.props.individualCancellation}
            i18n={this.props.i18n}
          />
        </div>

        <div className="uppy-Dashboard-Item-fileInfoAndButtons">
          <FileInfo
            file={file}
            id={this.props.id}
            acquirers={this.props.acquirers}
            containerWidth={this.props.containerWidth}
            containerHeight={this.props.containerHeight}
            i18n={this.props.i18n}
            toggleAddFilesPanel={this.props.toggleAddFilesPanel}
            toggleFileCard={this.props.toggleFileCard}
            metaFields={this.props.metaFields}
            isSingleFile={this.props.isSingleFile}
          />
          <Buttons
            file={file}
            metaFields={this.props.metaFields}
            showLinkToFileUploadResult={this.props.showLinkToFileUploadResult}
            showRemoveButton={showRemoveButton}
            canEditFile={this.props.canEditFile}
            uploadInProgressOrComplete={uploadInProgressOrComplete}
            toggleFileCard={this.props.toggleFileCard}
            openFileEditor={this.props.openFileEditor}
            uppy={this.props.uppy}
            i18n={this.props.i18n}
          />
        </div>
      </div>
    )
  }
}
