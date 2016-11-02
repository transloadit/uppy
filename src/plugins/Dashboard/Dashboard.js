import html from '../../core/html'
import FileList from './FileList'
import Tabs from './Tabs'
import FileCard from './FileCard'
import UploadBtn from './UploadBtn'
import ProgressCircle from './ProgressCircle'
import StatusBar from './StatusBar'
import { isTouchDevice, toArray } from '../../core/Utils'
import { closeIcon } from './icons'

export default function Dashboard (props) {
  // http://dev.edenspiekermann.com/2016/02/11/introducing-accessible-modal-dialog

  // const uploadStartedFilesCount = uploadStartedFiles.length
  // const completeFilesCount = completeFiles.length
  // const inProgressFilesCount = inProgressFiles.length
  // const totalFileCount = Object.keys(files).length
  // const newFileCount = newFiles.length

  const handleInputChange = (ev) => {
    ev.preventDefault()
    const files = toArray(ev.target.files)

    files.forEach((file) => {
      props.addFile({
        source: props.id,
        name: file.name,
        type: file.type,
        data: file
      })
    })
  }

  // @TODO Exprimental, work in progress
  // no names, weird API, Chrome-only http://stackoverflow.com/a/22940020
  const handlePaste = (ev) => {
    ev.preventDefault()

    const files = toArray(ev.clipboardData.items)
    files.forEach((file) => {
      if (file.kind !== 'file') return

      const blob = file.getAsFile()
      // console.log(blob)
      // console.log(blob.size)
      props.log('File pasted')
      props.addFile({
        source: props.id,
        name: file.name,
        type: file.type,
        data: blob
      })
    })
  }

  return html`<div class="Uppy UppyTheme--default UppyDashboard
                          ${isTouchDevice() ? 'Uppy--isTouchDevice' : ''}
                          ${props.semiTransparent ? 'UppyDashboard--semiTransparent' : ''}
                          ${!props.inline ? 'UppyDashboard--modal' : ''}"
                   aria-hidden="${props.inline ? 'false' : props.modal.isHidden}"
                   aria-label="${!props.inline
                                 ? props.i18n('dashboardWindowTitle')
                                 : props.i18n('dashboardTitle')}"
                   role="dialog"
                   onpaste=${handlePaste}>

    <div class="UppyDashboard-overlay"
         onclick=${props.hideModal}>
      <button class="UppyDashboard-close"
              aria-label="${props.i18n('closeModal')}"
              title="${props.i18n('closeModal')}"
              onclick=${props.hideModal}>${closeIcon()}</button>
    </div>

    <div class="UppyDashboard-inner" tabindex="0">
      <div class="UppyDashboard-innerWrap">

        ${Tabs({
          handleInputChange: handleInputChange,
          acquirers: props.acquirers,
          container: props.container,
          panelSelectorPrefix: props.panelSelectorPrefix,
          showPanel: props.showPanel,
          i18n: props.i18n
        })}

        ${FileCard({
          files: props.files,
          fileCardFor: props.fileCardFor,
          done: props.fileCardDone,
          metaFields: props.metaFields,
          log: props.log,
          i18n: props.i18n
        })}

        ${FileList({
          files: props.files,
          showFileCard: props.showFileCard,
          showProgressDetails: props.showProgressDetails,
          totalProgress: props.totalProgress,
          totalFileCount: props.totalFileCount,
          info: props.info,
          i18n: props.i18n,
          log: props.log,
          removeFile: props.removeFile,
          pauseAll: props.pauseAll,
          resumeAll: props.resumeAll,
          pauseUpload: props.pauseUpload,
          startUpload: props.startUpload
        })}

        <div class="UppyDashboard-actions">
          ${!props.autoProceed && props.newFiles.length > 0
            ? UploadBtn({
              i18n: props.i18n,
              startUpload: props.startUpload,
              newFileCount: props.newFiles.length
            })
            : null
          }

          ${false && props.uploadStartedFiles.length > 0
            ? ProgressCircle({
              totalProgress: props.totalProgress,
              isAllPaused: props.isAllPaused,
              isAllComplete: props.isAllComplete,
              pauseAll: props.pauseAll,
              resumeAll: props.resumeAll
            })
            : null
          }
        </div>

        ${props.uploadStartedFiles.length > 0 && !props.isAllComplete
          ? StatusBar({
            totalProgress: props.totalProgress,
            isAllComplete: props.isAllComplete,
            isAllPaused: props.isAllPaused,
            pauseAll: props.pauseAll,
            resumeAll: props.resumeAll,
            complete: props.completeFiles.length,
            inProgress: props.uploadStartedFiles.length,
            totalSpeed: props.totalSpeed,
            totalETA: props.totalETA
          })
          : null
        }

        <div class="UppyDashboardContent-panel"
             role="tabpanel"
             aria-hidden="${props.activeAcquirer ? props.activeAcquirer.isHidden : 'true'}">
          <div class="UppyDashboardContent-bar">
            <h2 class="UppyDashboardContent-title">
              ${props.i18n('importFrom')} ${props.activeAcquirer ? props.activeAcquirer.name : null}
            </h2>
            <button class="UppyDashboardContent-back"
                    onclick=${props.hideAllPanels}>${props.i18n('done')}</button>
             </div>
            ${props.activeAcquirer ? props.activeAcquirer.render(props.state) : null}
          </div>
        </div>

        <div class="UppyDashboard-progressindicators">
          ${props.progressindicators.map((target) => {
            return target.render(props.state)
          })}
        </div>

      </div>
    </div>
  </div>`
}
