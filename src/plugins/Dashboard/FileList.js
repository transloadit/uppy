// const html = require('yo-yo')

const { h } = require('picodom')
const hyperx = require('hyperx')
const html = hyperx(h, {attrToProp: false})

const FileItem = require('./FileItem')
const ActionBrowseTagline = require('./ActionBrowseTagline')
const { dashboardBgIcon } = require('./icons')

module.exports = (props) => {
  return html`<ul class="UppyDashboard-files
                         ${props.totalFileCount === 0 ? 'UppyDashboard-files--noFiles' : ''}">
      ${props.totalFileCount === 0
       ? html`<div class="UppyDashboard-bgIcon">
          ${dashboardBgIcon()}
          <h3 class="UppyDashboard-dropFilesTitle">
            ${ActionBrowseTagline({
              acquirers: props.acquirers,
              handleInputChange: props.handleInputChange,
              i18n: props.i18n
            })}
          </h3>
          ${props.note
            ? html`<p class="UppyDashboard-note">${props.note}</p>`
            : ''
          }
          <input class="UppyDashboard-input" type="file" name="files[]" multiple="true"
                 onchange=${props.handleInputChange} />
         </div>`
       : null
      }
      ${Object.keys(props.files).map((fileID) => {
        return FileItem({
          acquirers: props.acquirers,
          file: props.files[fileID],
          showFileCard: props.showFileCard,
          showProgressDetails: props.showProgressDetails,
          info: props.info,
          log: props.log,
          i18n: props.i18n,
          removeFile: props.removeFile,
          pauseUpload: props.pauseUpload,
          cancelUpload: props.cancelUpload,
          resumableUploads: props.resumableUploads,
          isWide: props.isWide
        })
      })}
    </ul>`
}
