import html from '../../core/html'
import Utils from '../../core/Utils'
import FileItem from './FileItem'
import FileCard from './FileCard'
import { closeIcon, localIcon, uploadIcon, dashboardBgIcon } from './icons'

export default function Dashboard (props, bus) {
  // http://dev.edenspiekermann.com/2016/02/11/introducing-accessible-modal-dialog

  const state = props.state
  const files = state.files
  const modal = state.modal
  const container = props.container
  const showFileCard = modal.showFileCard

  const hideModal = props.hideModal
  const hideAllPanels = props.hideAllPanels
  const showPanel = props.showPanel
  const log = props.log
  // const handleInputChange = props.handleInputChange

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

  function handleInputChange (ev) {
    ev.preventDefault()
    log('All right, something selected through input...')

    const files = Utils.toArray(ev.target.files)

    files.forEach((file) => {
      log(file)
      bus.emit('file-add', {
        source: this.id,
        name: file.name,
        type: file.type,
        data: file
      })
    })
  }

  const selectedFiles = Object.keys(files).filter((file) => {
    return files[file].progress.percentage === 0
    // return files[file].progress !== 100
  })
  const totalFileCount = Object.keys(files).length
  const selectedFileCount = Object.keys(selectedFiles).length
  const isSomethingSelected = selectedFileCount > 0

  return html`<div class="Uppy UppyTheme--default UppyDashboard ${isTouchDevice ? 'Uppy--isTouchDevice' : ''}"
                 aria-hidden="${modal.isHidden}"
                 aria-label="Uppy Dialog Window (Press escape to close)"
                 role="dialog">

    <div class="UppyDashboard-overlay"
                onclick=${hideModal}></div>

    <div class="UppyDashboard-inner" tabindex="0">
      <div class="UppyDashboard-innerWrap">

        <button class="UppyDashboard-close" title="Close Uppy modal"
                onclick=${hideModal}>${closeIcon()}</button>

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
          metaFields: state.metaFields
        }, bus)}

        <div class="UppyDashboard-files">
          <ul class="UppyDashboard-filesInner">
            ${totalFileCount === 0
              ? html`<div class="UppyDashboard-bgIcon">${dashboardBgIcon()}</div>`
              : ''
            }
            ${Object.keys(files).map((fileID) => {
              return FileItem(files[fileID], bus)
            })}
          </ul>
          ${!props.autoProceed && isSomethingSelected
            ? html`<button class="UppyButton--circular UppyDashboard-upload"
                           type="button"
                           title="Upload"
                           onclick=${next}>
                      ${uploadIcon()}
                      <sup class="UppyDashboard-uploadCount">${selectedFileCount}</sup>
                   </button>`
            : null
          }
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
