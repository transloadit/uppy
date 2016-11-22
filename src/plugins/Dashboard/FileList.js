import html from '../../core/html'
import FileItem from './FileItem'
import ActionBrowseTagline from './ActionBrowseTagline'
import { dashboardBgIcon } from './icons'

export default (props) => {
  return html`<ul class="UppyDashboard-files
                         ${props.totalFileCount === 0 ? 'UppyDashboard-files--noFiles' : ''}">
      ${props.totalFileCount === 0
       ? html`<div class="UppyDashboard-bgIcon">
          ${dashboardBgIcon()}
          <h3 class="UppyDashboard-dropFilesTitle">
            ${ActionBrowseTagline({
              acquirers: props.acquirers,
              container: props.container,
              handleInputChange: props.handleInputChange,
              i18n: props.i18n
            })}
          </h3>
          <input class="UppyDashboard-input" type="file" name="files[]" multiple="true"
                 onchange=${props.handleInputChange} />
         </div>`
       : null
      }
      ${Object.keys(props.files).map((fileID) => {
        return FileItem({
          file: props.files[fileID],
          showFileCard: props.showFileCard,
          showProgressDetails: props.showProgressDetails,
          info: props.info,
          log: props.log,
          i18n: props.i18n,
          removeFile: props.removeFile,
          pauseUpload: props.pauseUpload,
          cancelUpload: props.cancelUpload,
          resumableUploads: props.resumableUploads
        })
      })}
    </ul>`
}
