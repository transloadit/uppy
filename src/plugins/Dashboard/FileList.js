import html from '../../core/html'
import FileItem from './FileItem'
import { dashboardBgIcon,
         uploadIcon,
         iconPause,
         iconResume } from './icons'

export default (props) => {
  const files = props.files

  const newFiles = Object.keys(files).filter((file) => {
    return !files[file].progress.uploadStarted
  })
  const uploadStartedFiles = Object.keys(files).filter((file) => {
    return files[file].progress.uploadStarted
  })
  const completeFiles = Object.keys(files).filter((file) => {
    return files[file].progress.uploadComplete
  })
  const inProgressFiles = Object.keys(files).filter((file) => {
    return !files[file].progress.uploadComplete &&
           files[file].progress.uploadStarted &&
           !files[file].isPaused
  })

  const uploadStartedFilesCount = uploadStartedFiles.length
  const completeFilesCount = completeFiles.length
  const inProgressFilesCount = inProgressFiles.length
  const totalFileCount = Object.keys(files).length
  const newFileCount = newFiles.length

  const renderPauseResume = () => {
    if (uploadStartedFilesCount > 0) {
      if (inProgressFilesCount > 0) {
        return html`<button class="UppyDashboard-pauseResume
                                   UppyButton--circular
                                   UppyButton--yellow
                                   UppyButton--sizeS"
                            onclick=${() => props.pauseAll()}>${iconPause()}</button>`
      }

      if (uploadStartedFilesCount !== completeFilesCount) {
        return html`<button class="UppyDashboard-pauseResume
                                   UppyButton--circular
                                   UppyButton--green
                                   UppyButton--sizeS"
                            onclick=${() => props.resumeAll()}>${iconResume()}</button>`
      }
    }
  }

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
          removeFile: props.removeFile
        })
      })}
    </ul>
    <div class="UppyDashboard-actions">
      ${renderPauseResume()}
      ${!props.autoProceed && newFileCount > 0
        ? html`<button class="UppyButton--circular UppyButton--blue UppyButton--sizeM UppyDashboard-upload"
                       type="button"
                       title="Upload all files"
                       aria-label="Upload all files"
                       onclick=${props.startUpload}>
                  ${uploadIcon()}
                  <sup class="UppyDashboard-uploadCount"
                       title="Number of selected files"
                       aria-label="Number of selected files">
                        ${newFileCount}</sup>
               </button>`
        : null
      }
    </div>
  </div>`
}
