const FileItem = require('./FileItem')
const ActionBrowseTagline = require('./ActionBrowseTagline')
const { dashboardBgIcon } = require('./icons')
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
        {dashboardBgIcon()}
        <h3 class="uppy-Dashboard-dropFilesTitle">
          {h(ActionBrowseTagline, {
            acquirers: props.acquirers,
            handleInputChange: props.handleInputChange,
            i18n: props.i18n
          })}
        </h3>
        { props.note && <p class="uppy-Dashboard-note">{props.note}</p> }
      </div>
    }
    {Object.keys(props.files).map((fileID) => {
      return FileItem({
        acquirers: props.acquirers,
        file: props.files[fileID],
        toggleFileCard: props.toggleFileCard,
        showProgressDetails: props.showProgressDetails,
        info: props.info,
        log: props.log,
        i18n: props.i18n,
        removeFile: props.removeFile,
        pauseUpload: props.pauseUpload,
        cancelUpload: props.cancelUpload,
        retryUpload: props.retryUpload,
        resumableUploads: props.resumableUploads,
        isWide: props.isWide,
        showLinkToFileUploadResult: props.showLinkToFileUploadResult,
        metaFields: props.metaFields
      })
    })}
  </ul>
}
