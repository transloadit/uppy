import html from '../../core/html'
import FileItem from './FileItem'
import TotalProgress from './TotalProgress'
import { dashboardBgIcon,
         uploadIcon } from './icons'

export default (props) => {
  const files = props.files

  const newFiles = Object.keys(files).filter((file) => {
    return !files[file].progress.uploadStarted
  })
  const uploadStartedFiles = Object.keys(files).filter((file) => {
    return files[file].progress.uploadStarted
  })
  // const completeFiles = Object.keys(files).filter((file) => {
  //   return files[file].progress.uploadComplete
  // })
  const inProgressFiles = Object.keys(files).filter((file) => {
    return !files[file].progress.uploadComplete &&
           files[file].progress.uploadStarted &&
           !files[file].isPaused
  })

  const uploadStartedFilesCount = uploadStartedFiles.length
  // const completeFilesCount = completeFiles.length
  const inProgressFilesCount = inProgressFiles.length
  const totalFileCount = Object.keys(files).length
  const newFileCount = newFiles.length

  return html`<div class="UppyDashboard-files">
    <ul class="UppyDashboard-filesInner">
      ${totalFileCount === 0
        ? html`<div class="UppyDashboard-bgIcon">${dashboardBgIcon()}</div>`
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
    </ul>
    <div class="UppyDashboard-actions">
      ${!props.autoProceed && newFileCount > 0
        ? html`<div class="UppyDashboard-actionsItem">
          <button class="UppyButton--circular
                              UppyButton--blue
                              UppyButton--sizeM
                              UppyDashboard-upload"
                       type="button"
                       title="${props.i18n('uploadAllNewFiles')}"
                       aria-label="${props.i18n('uploadAllNewFiles')}"
                       onclick=${props.startUpload}>
                  ${uploadIcon()}
                  <sup class="UppyDashboard-uploadCount"
                       title="${props.i18n('numberOfSelectedFiles')}"
                       aria-label="${props.i18n('numberOfSelectedFiles')}">
                        ${newFileCount}</sup>
          </button>
        </div>`
        : null
      }
      ${uploadStartedFilesCount > 0
        ? TotalProgress({
          totalProgress: props.totalProgress,
          isAllPaused: inProgressFilesCount === 0,
          isAllComplete: props.totalProgress === 100,
          pauseAll: props.pauseAll,
          resumeAll: props.resumeAll
        })
        : null
      }
    </div>
  </div>`
}
