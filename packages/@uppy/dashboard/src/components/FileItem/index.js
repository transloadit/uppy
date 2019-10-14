const { h } = require('preact')
const classNames = require('classnames')
const pure = require('../../utils/pure')
const FilePreviewAndLink = require('./FilePreviewAndLink')
const FileProgress = require('./FileProgress')
const FileInfo = require('./FileInfo')
const Buttons = require('./Buttons')

module.exports = pure(function FileItem (props) {
  const file = props.file

  const isProcessing = file.progress.preprocess || file.progress.postprocess
  const isUploaded = file.progress.uploadComplete && !isProcessing && !file.error
  const uploadInProgressOrComplete = file.progress.uploadStarted || isProcessing
  const uploadInProgress = (file.progress.uploadStarted && !file.progress.uploadComplete) || isProcessing
  const isPaused = file.isPaused || false
  const error = file.error || false

  const showRemoveButton = props.individualCancellation
    ? !isUploaded
    : !uploadInProgress && !isUploaded

  const dashboardItemClass = classNames(
    'uppy-u-reset',
    'uppy-DashboardItem',
    { 'is-inprogress': uploadInProgress },
    { 'is-processing': isProcessing },
    { 'is-complete': isUploaded },
    { 'is-paused': isPaused },
    { 'is-error': !!error },
    { 'is-resumable': props.resumableUploads },
    { 'is-noIndividualCancellation': !props.individualCancellation }
  )

  return (
    <li class={dashboardItemClass} id={`uppy_${file.id}`}>
      <div class="uppy-DashboardItem-preview">
        <FilePreviewAndLink
          file={file}
          showLinkToFileUploadResult={props.showLinkToFileUploadResult}
        />
        <FileProgress
          {...props}
          file={file}
          error={error}
          isUploaded={isUploaded}
        />
      </div>

      <div class="uppy-DashboardItem-fileInfoAndButtons">
        <FileInfo
          file={file}
          id={props.id}
          acquirers={props.acquirers}
          containerWidth={props.containerWidth}
          i18n={props.i18n}
        />
        <Buttons
          file={file}
          metaFields={props.metaFields}

          showLinkToFileUploadResult={props.showLinkToFileUploadResult}
          showRemoveButton={showRemoveButton}

          uploadInProgressOrComplete={uploadInProgressOrComplete}
          removeFile={props.removeFile}
          toggleFileCard={props.toggleFileCard}

          i18n={props.i18n}
          log={props.log}
          info={props.info}
        />
      </div>
    </li>
  )
})
