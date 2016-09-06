import html from '../../core/html'
import Utils from '../../core/Utils'
import FileItem from './FileItem'
import FileCard from './FileCard'
import { closeIcon, localIcon, uploadIcon, dashboardBgIcon, iconPause, iconResume } from './icons'

export default function Dashboard (props) {
  // http://dev.edenspiekermann.com/2016/02/11/introducing-accessible-modal-dialog

  const { bus,
          // log,
          state,
          container,
          showProgressDetails,
          hideModal,
          hideAllPanels,
          showPanel } = props

  const files = state.files
  const modal = state.modal
  const showFileCard = modal.showFileCard

  const acquirers = modal.targets.filter((target) => {
    return target.type === 'acquirer'
  })

  const progressindicators = modal.targets.filter((target) => {
    return target.type === 'progressindicator'
  })

  const isTouchDevice = Utils.isTouchDevice()

  const onSelect = (ev) => {
    const input = document.querySelector(`${container} .UppyDashboard-input`)
    input.click()
  }

  const next = (ev) => {
    bus.emit('core:upload')
  }

  const handleInputChange = (ev) => {
    ev.preventDefault()
    // log('All right, something selected through input...')

    const files = Utils.toArray(ev.target.files)

    files.forEach((file) => {
      // log(file)
      bus.emit('file-add', {
        source: props.id,
        name: file.name,
        type: file.type,
        data: file
      })
    })
  }

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

  const uploadStartedFilesCount = Object.keys(uploadStartedFiles).length
  const completeFilesCount = Object.keys(completeFiles).length
  const inProgressFilesCount = Object.keys(inProgressFiles).length
  const totalFileCount = Object.keys(files).length
  const newFileCount = Object.keys(newFiles).length

  function renderPauseResume () {
    if (uploadStartedFilesCount > 0) {
      if (inProgressFilesCount > 0) {
        return html`<button class="UppyDashboard-pauseResume
                                   UppyButton--circular
                                   UppyButton--yellow
                                   UppyButton--sizeS"
                            onclick=${() => bus.emit('core:pause-all')}>${iconPause()}</button>`
      }

      if (uploadStartedFilesCount !== completeFilesCount) {
        return html`<button class="UppyDashboard-pauseResume
                                   UppyButton--circular
                                   UppyButton--green
                                   UppyButton--sizeS"
                            onclick=${() => bus.emit('core:resume-all')}>${iconResume()}</button>`
      }
    }
  }

  return html`<div class="Uppy UppyTheme--default UppyDashboard
                          ${isTouchDevice ? 'Uppy--isTouchDevice' : ''}
                          ${!props.inline ? 'UppyDashboard--modal' : ''}"
                   aria-hidden="${props.inline ? 'false' : modal.isHidden}"
                   aria-label="Uppy Dialog Window (Press escape to close)"
                   role="dialog">

    <div class="UppyDashboard-overlay"
         onclick=${hideModal}></div>

    <button class="UppyDashboard-close"
            title="Close Uppy modal"
            onclick=${hideModal}>${closeIcon()}</button>

    <div class="UppyDashboard-inner" tabindex="0">
      <div class="UppyDashboard-innerWrap">
        <div class="UppyDashboardTabs">
          <h3 class="UppyDashboardTabs-title">Drop files here, paste or import from</h3>
          <nav>
            <ul class="UppyDashboardTabs-list" role="tablist">
              <li class="UppyDashboardTab">
                <button class="UppyDashboardTab-btn UppyDashboard-focus"
                        role="tab"
                        tabindex="0"
                        onclick=${onSelect}>
                  ${localIcon()}
                  <h5 class="UppyDashboardTab-name">Local Disk</h5>
                </button>
                <input class="UppyDashboard-input" type="file" name="files[]" multiple="true"
                       onchange=${handleInputChange} />
              </li>
              ${acquirers.map((target) => {
                return html`<li class="UppyDashboardTab">
                  <button class="UppyDashboardTab-btn"
                          role="tab"
                          tabindex="0"
                          aria-controls="${props.panelSelectorPrefix}--${target.id}"
                          aria-selected="${target.isHidden ? 'false' : 'true'}"
                          onclick=${showPanel.bind(this, target.id)}>
                    ${target.icon}
                    <h5 class="UppyDashboardTab-name">${target.name}</h5>
                  </button>
                </li>`
              })}
            </ul>
          </nav>
        </div>

        ${FileCard({
          files: files,
          showFileCard: showFileCard,
          metaFields: state.metaFields,
          bus: bus
        })}

        <div class="UppyDashboard-files">
          <ul class="UppyDashboard-filesInner">
            ${totalFileCount === 0
              ? html`<div class="UppyDashboard-bgIcon">${dashboardBgIcon()}</div>`
              : null
            }
            ${Object.keys(files).map((fileID) => {
              return FileItem({
                file: files[fileID],
                showProgressDetails: showProgressDetails,
                bus: bus
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
                             onclick=${next}>
                        ${uploadIcon()}
                        <sup class="UppyDashboard-uploadCount"
                             title="Number of selected files"
                             aria-label="Number of selected files">
                              ${newFileCount}</sup>
                     </button>`
              : null
            }
          </div>
        </div>

        ${acquirers.map((target) => {
          return html`<div class="UppyDashboardContent-panel"
                         id="${props.panelSelectorPrefix}--${target.id}"
                         role="tabpanel"
                         aria-hidden="${target.isHidden}">
             <div class="UppyDashboardContent-bar">
               <h2 class="UppyDashboardContent-title">Import From ${target.name}</h2>
               <button class="UppyDashboardContent-back"
                       onclick=${hideAllPanels}>Done</button>
             </div>
            ${target.render(state)}
          </div>`
        })}

        <div class="UppyDashboard-progressindicators">
          ${progressindicators.map((target) => {
            return target.render(state)
          })}
        </div>

      </div>
    </div>
  </div>`
}
