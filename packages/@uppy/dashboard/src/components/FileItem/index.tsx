import type Uppy from '@uppy/core'
import type { Body, Meta, State, UppyFile } from '@uppy/core'
import type { I18n } from '@uppy/utils/lib/Translator'
import classNames from 'classnames'
// biome-ignore lint/style/useImportType: h is not a type
import { Component, type ComponentChild, h } from 'preact'
import { shallowEqualObjects } from 'shallow-equal'
import type { DashboardState } from '../../Dashboard.js'
import Buttons from './Buttons/index.js'
import FileInfo from './FileInfo/index.js'
import FilePreviewAndLink from './FilePreviewAndLink/index.js'
import FileProgress from './FileProgress/index.js'

type Props<M extends Meta, B extends Body> = {
  file: UppyFile<M, B>
  handleRequestThumbnail: (file: UppyFile<M, B>) => void
  handleCancelThumbnail: (file: UppyFile<M, B>) => void
  individualCancellation: boolean
  showRemoveButtonAfterComplete: boolean
  recoveredState: State<M, B>['recoveredState']
  resumableUploads: boolean
  i18n: I18n
  role: string
  showLinkToFileUploadResult: boolean
  toggleFileCard: (show: boolean, fileId: string) => void
  metaFields: DashboardState<M, B>['metaFields']
  id: string
  containerWidth: number
  containerHeight: number
  toggleAddFilesPanel: (show: boolean) => void
  isSingleFile: boolean
  hideRetryButton: boolean
  hideCancelButton: boolean
  hidePauseResumeButton: boolean
  canEditFile: (file: UppyFile<M, B>) => boolean
  openFileEditor: (file: UppyFile<M, B>) => void
  uppy: Uppy<M, B>
}

export default class FileItem<M extends Meta, B extends Body> extends Component<
  Props<M, B>
> {
  componentDidMount(): void {
    const { file } = this.props
    if (!file.preview) {
      this.props.handleRequestThumbnail(file)
    }
  }

  shouldComponentUpdate(nextProps: Props<M, B>): boolean {
    return !shallowEqualObjects(this.props, nextProps)
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
      !!file.progress.uploadComplete && !isProcessing && !file.error
    const uploadInProgressOrComplete =
      !!file.progress.uploadStarted || !!isProcessing
    const uploadInProgress =
      (file.progress.uploadStarted && !file.progress.uploadComplete) ||
      isProcessing
    const error = file.error || false

    // File that Golden Retriever was able to partly restore (only meta, not blob),
    // users still need to re-add it, so it’s a ghost
    const { isGhost } = file

    let showRemoveButton = this.props.individualCancellation
      ? !isUploaded
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
        role={this.props.role as h.JSX.AriaRole}
      >
        <div className="uppy-Dashboard-Item-preview">
          <FilePreviewAndLink
            file={file}
            showLinkToFileUploadResult={this.props.showLinkToFileUploadResult}
            i18n={this.props.i18n}
            toggleFileCard={this.props.toggleFileCard}
            metaFields={this.props.metaFields}
          />
          <FileProgress<M, B>
            uppy={this.props.uppy}
            file={file}
            error={error}
            isUploaded={isUploaded}
            hideRetryButton={this.props.hideRetryButton}
            hideCancelButton={this.props.hideCancelButton}
            hidePauseResumeButton={this.props.hidePauseResumeButton}
            recoveredState={this.props.recoveredState}
            resumableUploads={this.props.resumableUploads}
            individualCancellation={this.props.individualCancellation}
            i18n={this.props.i18n}
          />
        </div>

        <div className="uppy-Dashboard-Item-fileInfoAndButtons">
          <FileInfo
            file={file}
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
