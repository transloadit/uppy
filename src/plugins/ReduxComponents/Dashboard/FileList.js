import html from '../../core/html'
import prettyBytes from 'pretty-bytes'
import FileItem from './FileItem'
import ProgressCircle from './ProgressCircle'
import StatusBar from './StatusBar'
import { getSpeed, getETA, prettyETA } from '../../core/Utils'
import { dashboardBgIcon,
         uploadIcon } from './icons'

function getTotalSpeed (files) {
  let totalSpeed = 0
  files.forEach((file) => {
    totalSpeed = totalSpeed + getSpeed(file.progress)
  })
  return totalSpeed
}

function getTotalETA (files) {
  let totalSeconds = 0

  files.forEach((file) => {
    totalSeconds = totalSeconds + getETA(file.progress)
  })

  return totalSeconds
}

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

  let inProgressFilesArray = []
  inProgressFiles.forEach((file) => {
    inProgressFilesArray.push(files[file])
  })

  const totalSpeed = prettyBytes(getTotalSpeed(inProgressFilesArray))
  const totalETA = prettyETA(getTotalETA(inProgressFilesArray))

  const uploadStartedFilesCount = uploadStartedFiles.length
  const completeFilesCount = completeFiles.length
  const inProgressFilesCount = inProgressFiles.length
  const isAllComplete = props.totalProgress === 100
  const isAllPaused = inProgressFilesCount === 0 && !isAllComplete
  const totalFileCount = Object.keys(files).length
  const newFileCount = newFiles.length

  const togglePauseResume = () => {
    if (isAllComplete) return

    if (isAllPaused) {
      return props.resumeAll()
    }

    return props.pauseAll()
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
        ? ProgressCircle({
          totalProgress: props.totalProgress,
          isAllPaused: isAllPaused,
          isAllComplete: isAllComplete,
          togglePauseResume: togglePauseResume
        })
        : null
      }
    </div>

    ${uploadStartedFilesCount > 0
      ? StatusBar({
        totalProgress: props.totalProgress,
        isAllComplete: isAllComplete,
        isAllPaused: isAllPaused,
        complete: completeFilesCount,
        inProgress: uploadStartedFilesCount,
        totalSpeed: totalSpeed,
        totalETA: totalETA
      })
      : null
    }

  </div>`
}
