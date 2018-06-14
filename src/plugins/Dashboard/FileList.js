const FileItem = require('./FileItem')
const ActionBrowseTagline = require('./ActionBrowseTagline')
// const { dashboardBgIcon } = require('./icons')
const classNames = require('classnames')
const { h } = require('preact')

const poweredByUppy = (props) => {
  return <a tabindex="-1" href="https://uppy.io" rel="noreferrer noopener" target="_blank" class="uppy-Dashboard-poweredBy">Powered by <svg aria-hidden="true" class="UppyIcon uppy-Dashboard-poweredByIcon" width="11" height="11" viewBox="0 0 11 11" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.365 10.5l-.01-4.045h2.612L5.5.806l-4.467 5.65h2.604l.01 4.044h3.718z" fill-rule="evenodd" />
  </svg><span class="uppy-Dashboard-poweredByUppy">Uppy</span></a>
}

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
        { props.proudlyDisplayPoweredByUppy && poweredByUppy(props) }
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
