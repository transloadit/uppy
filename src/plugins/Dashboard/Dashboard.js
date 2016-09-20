import html from '../../core/html'
import FileList from './FileList'
import Tabs from './Tabs'
import FileCard from './FileCard'
import { isTouchDevice, toArray } from '../../core/Utils'
import { closeIcon } from './icons'

export default function Dashboard (props) {
  // http://dev.edenspiekermann.com/2016/02/11/introducing-accessible-modal-dialog

  const state = props.state
  const totalProgress = state.totalProgress
  const files = state.files
  const modal = state.modal

  const acquirers = modal.targets.filter((target) => {
    return target.type === 'acquirer'
  })

  const progressindicators = modal.targets.filter((target) => {
    return target.type === 'progressindicator'
  })

  const removeFile = (fileID) => {
    props.bus.emit('core:file-remove', fileID)
  }

  const startUpload = (ev) => {
    props.bus.emit('core:upload')
  }

  const pauseUpload = (fileID) => {
    props.bus.emit('core:upload-pause', fileID)
  }

  const showFileCard = (fileID) => {
    props.bus.emit('dashboard:file-card', fileID)
  }

  const fileCardDone = (meta, fileID) => {
    props.bus.emit('core:update-meta', meta, fileID)
    props.bus.emit('dashboard:file-card')
  }

  const info = (text, type, duration) => {
    props.bus.emit('informer', text, type, duration)
  }

  const localInputChange = (ev) => {
    ev.preventDefault()

    const files = toArray(ev.target.files)

    files.forEach((file) => {
      props.bus.emit('core:file-add', {
        source: props.id,
        name: file.name,
        type: file.type,
        data: file
      })
    })
  }

  return html`<div class="Uppy UppyTheme--default UppyDashboard
                          ${isTouchDevice() ? 'Uppy--isTouchDevice' : ''}
                          ${!props.inline ? 'UppyDashboard--modal' : ''}"
                   aria-hidden="${props.inline ? 'false' : modal.isHidden}"
                   aria-label="${!props.inline
                                 ? props.i18n('dashboardWindowTitle')
                                 : props.i18n('dashboardTitle')}"
                   role="dialog"
                   onpaste=${props.onPaste}>

    <div class="UppyDashboard-overlay"
         onclick=${props.hideModal}></div>

    <button class="UppyDashboard-close"
            aria-label="${props.i18n('closeModal')}"
            title="${props.i18n('closeModal')}"
            onclick=${props.hideModal}>${closeIcon()}</button>

    <div class="UppyDashboard-inner" tabindex="0">
      <div class="UppyDashboard-innerWrap">

        ${Tabs({
          localInputChange: localInputChange,
          acquirers: acquirers,
          container: props.container,
          panelSelectorPrefix: props.panelSelectorPrefix,
          showPanel: props.showPanel,
          i18n: props.i18n
        })}

        ${FileCard({
          files: files,
          fileCardFor: modal.fileCardFor,
          done: fileCardDone,
          metaFields: state.metaFields,
          log: props.log,
          i18n: props.i18n
        })}

        ${FileList({
          files: files,
          showFileCard: showFileCard,
          showProgressDetails: props.showProgressDetails,
          totalProgress: totalProgress,
          info: info,
          i18n: props.i18n,
          log: props.log,
          removeFile: removeFile,
          pauseAll: props.pauseAll,
          resumeAll: props.resumeAll,
          pauseUpload: pauseUpload,
          startUpload: startUpload
        })}

        ${acquirers.map((target) => {
          return html`<div class="UppyDashboardContent-panel"
                           id="${props.panelSelectorPrefix}--${target.id}"
                           role="tabpanel"
                           aria-hidden="${target.isHidden}">
             <div class="UppyDashboardContent-bar">
               <h2 class="UppyDashboardContent-title">${props.i18n('importFrom')} ${target.name}</h2>
               <button class="UppyDashboardContent-back"
                       onclick=${props.hideAllPanels}>${props.i18n('done')}</button>
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
