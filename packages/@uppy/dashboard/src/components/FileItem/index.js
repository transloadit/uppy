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

  render () {
    const file = this.props.file

    const isProcessing = file.progress.preprocess || file.progress.postprocess
    const isUploaded = file.progress.uploadComplete && !isProcessing && !file.error
    const uploadInProgressOrComplete = file.progress.uploadStarted || isProcessing
    const uploadInProgress = (file.progress.uploadStarted && !file.progress.uploadComplete) || isProcessing
    const isPaused = file.isPaused || false
    const error = file.error || false

    const showRemoveButton = this.props.individualCancellation
      ? !isUploaded
      : !uploadInProgress && !isUploaded

    const dashboardItemClass = classNames({
      'uppy-u-reset': true,
      'uppy-DashboardItem': true,
      'is-inprogress': uploadInProgress,
      'is-processing': isProcessing,
      'is-complete': isUploaded,
      'is-paused': isPaused,
      'is-error': !!error,
      'is-resumable': this.props.resumableUploads,
      'is-noIndividualCancellation': !this.props.individualCancellation
    })

    return (
      <li class={dashboardItemClass} id={`uppy_${file.id}`}>
        <div class="uppy-DashboardItem-preview">
          <FilePreviewAndLink
            file={file}
            showLinkToFileUploadResult={this.props.showLinkToFileUploadResult}
          />
          <FileProgress
            {...this.props}
            file={file}
            error={error}
            isUploaded={isUploaded}
          />
        </div>

        <div class="uppy-DashboardItem-fileInfoAndButtons">
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

            uploadInProgressOrComplete={uploadInProgressOrComplete}
            removeFile={this.props.removeFile}
            toggleFileCard={this.props.toggleFileCard}

            i18n={this.props.i18n}
            log={this.props.log}
            info={this.props.info}
          />
        </div>
      </li>
    )
  }
}
