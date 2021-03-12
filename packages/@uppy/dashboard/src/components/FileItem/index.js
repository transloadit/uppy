const { h, Component } = require('preact')
const classNames = require('classnames')
const shallowEqual = require('is-shallow-equal')
const FilePreviewAndLink = require('./FilePreviewAndLink')
const FileProgress = require('./FileProgress')
const FileInfo = require('./FileInfo')
const Buttons = require('./Buttons')

module.exports = class FileItem extends Component {
  shouldComponentUpdate (nextProps) {
    return !shallowEqual(this.props, nextProps)
  }

  componentDidMount () {
    const file = this.props.file
    if (!file.preview) {
      this.props.handleRequestThumbnail(file)
    }
  }

  componentWillUnmount () {
    const file = this.props.file
    if (!file.preview) {
      this.props.handleCancelThumbnail(file)
    }
  }

  render () {
    const file = this.props.file

    const isProcessing = file.progress.preprocess || file.progress.postprocess
    const isUploaded = file.progress.uploadComplete && !isProcessing && !file.error
    const uploadInProgressOrComplete = file.progress.uploadStarted || isProcessing
    const uploadInProgress = (file.progress.uploadStarted && !file.progress.uploadComplete) || isProcessing
    const error = file.error || false

    let showRemoveButton = this.props.individualCancellation
      ? !isUploaded
      : !uploadInProgress && !isUploaded

    if (isUploaded && this.props.showRemoveButtonAfterComplete) {
      showRemoveButton = true
    }

    const dashboardItemClass = classNames({
      'uppy-Dashboard-Item': true,
      'is-inprogress': uploadInProgress,
      'is-processing': isProcessing,
      'is-complete': isUploaded,
      'is-error': !!error,
      'is-resumable': this.props.resumableUploads,
      'is-noIndividualCancellation': !this.props.individualCancellation
    })

    return (
      <div
        class={dashboardItemClass}
        id={`uppy_${file.id}`}
        role={this.props.role}
      >
        <div class="uppy-Dashboard-Item-preview">
          <FilePreviewAndLink
            file={file}
            showLinkToFileUploadResult={this.props.showLinkToFileUploadResult}
          />
          <FileProgress
            file={file}
            error={error}
            isUploaded={isUploaded}

            hideRetryButton={this.props.hideRetryButton}
            hideCancelButton={this.props.hideCancelButton}
            hidePauseResumeButton={this.props.hidePauseResumeButton}

            showRemoveButtonAfterComplete={this.props.showRemoveButtonAfterComplete}

            resumableUploads={this.props.resumableUploads}
            individualCancellation={this.props.individualCancellation}

            pauseUpload={this.props.pauseUpload}
            cancelUpload={this.props.cancelUpload}
            retryUpload={this.props.retryUpload}
            i18n={this.props.i18n}
          />
        </div>

        <div class="uppy-Dashboard-Item-fileInfoAndButtons">
          <FileInfo
            file={file}
            id={this.props.id}
            acquirers={this.props.acquirers}
            containerWidth={this.props.containerWidth}
            i18n={this.props.i18n}
          />
          <Buttons
            file={file}
            metaFields={this.props.metaFields}

            showLinkToFileUploadResult={this.props.showLinkToFileUploadResult}
            showRemoveButton={showRemoveButton}
            canEditFile={this.props.canEditFile}

            uploadInProgressOrComplete={uploadInProgressOrComplete}
            removeFile={this.props.removeFile}
            toggleFileCard={this.props.toggleFileCard}
            openFileEditor={this.props.openFileEditor}

            i18n={this.props.i18n}
            log={this.props.log}
            info={this.props.info}
          />
        </div>
      </div>
    )
  }
}
