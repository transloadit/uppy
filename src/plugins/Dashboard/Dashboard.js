import html from '../../core/html'
import { isTouchDevice, toArray } from '../../core/Utils'
import FileList from './FileList'
import Tabs from './Tabs'
import FileCard from './FileCard'
import { closeIcon } from './icons'

export default function Dashboard (props) {
  // http://dev.edenspiekermann.com/2016/02/11/introducing-accessible-modal-dialog

  const state = props.state

  const files = state.files
  const modal = state.modal

  const acquirers = modal.targets.filter((target) => {
    return target.type === 'acquirer'
  })

  const progressindicators = modal.targets.filter((target) => {
    return target.type === 'progressindicator'
  })

  const removeFile = (fileID) => {
    // this seems to be working in latest Chrome, Firefox and Safari,
    //   // but might not be 100% cross-browser, needs testing
    //   // https://davidwalsh.name/css-animation-callback
    //   // el.addEventListener('animationend', () => {
    //   //   bus.emit('file-remove', file.id)
    //   // })
    props.bus.emit('file-remove', fileID)
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
      // log(file)
      props.bus.emit('file-add', {
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
                   aria-label="Uppy Dialog Window (Press escape to close)"
                   role="dialog">

    <div class="UppyDashboard-overlay"
         onclick=${props.hideModal}></div>

    <button class="UppyDashboard-close"
            aria-label="Close Uppy modal"
            title="Close Uppy modal"
            onclick=${props.hideModal}>${closeIcon()}</button>

    <div class="UppyDashboard-inner" tabindex="0">
      <div class="UppyDashboard-innerWrap">

        ${Tabs({
          localInputChange: localInputChange,
          acquirers: acquirers,
          container: props.container,
          panelSelectorPrefix: props.panelSelectorPrefix,
          showPanel: props.showPanel
        })}

        ${FileCard({
          files: files,
          fileCardFor: modal.fileCardFor,
          done: fileCardDone,
          metaFields: state.metaFields,
          pauseUpload: pauseUpload,
          log: props.log
        })}

        ${FileList({
          files: files,
          showFileCard: showFileCard,
          showProgressDetails: props.showProgressDetails,
          info: info,
          i18n: props.i18n,
          log: props.log,
          removeFile: removeFile,
          pauseAll: props.pauseAll,
          resumeAll: props.resumeAll,
          startUpload: startUpload
        })}

        ${acquirers.map((target) => {
          return html`<div class="UppyDashboardContent-panel"
                         id="${props.panelSelectorPrefix}--${target.id}"
                         role="tabpanel"
                         aria-hidden="${target.isHidden}">
             <div class="UppyDashboardContent-bar">
               <h2 class="UppyDashboardContent-title">Import From ${target.name}</h2>
               <button class="UppyDashboardContent-back"
                       onclick=${props.hideAllPanels}>Done</button>
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
