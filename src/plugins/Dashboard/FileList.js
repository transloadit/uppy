import html from '../../core/html'
import FileItem from './FileItem'
import { dashboardBgIcon } from './icons'

export default (props) => {
  return html`<ul class="UppyDashboard-files
                         ${props.totalFileCount === 0 ? 'UppyDashboard-files--noFiles' : ''}">
      ${props.totalFileCount === 0
       ? html`<div class="UppyDashboard-bgIcon">
        ${dashboardBgIcon()}
        <h4 class="UppyDashboard-dropFilesTitle">${props.i18n('dropPasteImport')}</h4>
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
          pauseUpload: props.pauseUpload
        })
      })}
    </ul>`
}
