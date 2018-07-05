const FileItem = require('./FileItem')
const classNames = require('classnames')
const { h } = require('preact')

const DashboardContentTitle = (props) => {
  if (props.newFiles.length) {
    return props.i18n('xFilesSelected', { smart_count: props.newFiles.length })
  }
}

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
          <DashboardContentTitle {...props} />
        </div>
        <button class="uppy-DashboardContent-back"
          type="button"
          onclick={props.cancelAll}>{props.i18n('cancel')}</button>
        <button class="uppy-DashboardContent-addMore"
          type="button"
          aria-label={props.i18n('addMoreFiles')}
          title={props.i18n('addMoreFiles')}
          onclick={(ev) => props.toggleAddFilesPanel(true)}>
          <svg class="UppyIcon" width="15" height="15" viewBox="0 0 13 13" version="1.1" xmlns="http://www.w3.org/2000/svg">
            <path d="M7,6 L13,6 L13,7 L7,7 L7,13 L6,13 L6,7 L0,7 L0,6 L6,6 L6,0 L7,0 L7,6 Z" />
          </svg>
        </button>
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
