const FileItem = require('./FileItem')
const ActionBrowseTagline = require('./ActionBrowseTagline')
// const { dashboardBgIcon } = require('./icons')
const classNames = require('classnames')
const { h } = require('preact')

module.exports = (props) => {
  const noFiles = props.totalFileCount === 0
  const dashboardFilesClass = classNames(
    'uppy-Dashboard-files',
    { 'uppy-Dashboard-files--noFiles': noFiles }
  )

  return <ul class={dashboardFilesClass}>
    {noFiles &&
      <div class="uppy-Dashboard-bgIcon">
        <div class="uppy-Dashboard-dropFilesTitle">
          <ActionBrowseTagline
            acquirers={props.acquirers}
            handleInputChange={props.handleInputChange}
            i18n={props.i18n}
            i18nArray={props.i18nArray}
            allowedFileTypes={props.allowedFileTypes}
            maxNumberOfFiles={props.maxNumberOfFiles}
          />
        </div>
        { props.note && <div class="uppy-Dashboard-note">{props.note}</div> }
      </div>
    }
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
}
