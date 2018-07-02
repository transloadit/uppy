const FileItem = require('./FileItem')
const classNames = require('classnames')
const { h } = require('preact')

module.exports = (props) => {
  const noFiles = props.totalFileCount === 0
  const dashboardFilesClass = classNames(
    'uppy-Dashboard-files',
    { 'uppy-Dashboard-files--noFiles': noFiles }
  )

  return (
    <div class="uppy-Dashboard-filesContainer">
      <div class="uppy-DashboardContent-bar">
        <div class="uppy-DashboardContent-title" role="heading" aria-level="h1">
          {props.i18n('addingMoreFiles')}
        </div>
        <button class="uppy-DashboardContent-back"
          type="button"
          onclick={props.cancelAll}>{props.i18n('cancel')}</button>
        <button class="uppy-DashboardContent-addMore"
          type="button"
          onclick={props.toggleAddFilesPanel}>&#43;</button>
      </div>
      <ul class={dashboardFilesClass}>
        {Object.keys(props.files).map((fileID) => (
          <FileItem
            acquirers={props.acquirers}
            file={props.files[fileID]}
            toggleFileCard={props.toggleFileCard}
            showProgressDetails={props.showProgressDetails}
            info={props.info}
            log={props.log}
            i18n={props.i18n}
            removeFile={props.removeFile}
            pauseUpload={props.pauseUpload}
            cancelUpload={props.cancelUpload}
            retryUpload={props.retryUpload}
            hidePauseResumeCancelButtons={props.hidePauseResumeCancelButtons}
            hideRetryButton={props.hideRetryButton}
            resumableUploads={props.resumableUploads}
            bundled={props.bundled}
            isWide={props.isWide}
            showLinkToFileUploadResult={props.showLinkToFileUploadResult}
            metaFields={props.metaFields}
          />
        ))}
      </ul>
    </div>
  )
}
