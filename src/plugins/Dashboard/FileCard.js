import html from '../../core/html'
import { iconText, iconFile, iconAudio, checkIcon } from './icons'

function getIconByMime (fileTypeGeneral) {
  switch (fileTypeGeneral) {
    case 'text':
      return iconText()
    case 'audio':
      return iconAudio()
    default:
      return iconFile()
  }
}

export default function fileCard (props, bus) {
  const files = props.files
  const showFileCard = props.showFileCard
  let metaFields = props.metaFields

  const file = showFileCard ? files[showFileCard] : false
  const meta = {}

  function tempStoreMeta (ev) {
    const value = ev.target.value
    const name = ev.target.attributes.name.value
    meta[name] = value
  }

  function done () {
    bus.emit('core:update-meta', meta, file.id)
    bus.emit('dashboard:file-card')
  }

  function renderMetaFields (file) {
    metaFields = metaFields || []
    return metaFields.map((field) => {
      return html`<input class="UppyDashboardFileCard-input"
                         name="${field.name}"
                         type="text"
                         value="${file.meta[field.name]}"
                         placeholder="${field.placeholder || ''}"
                         onkeyup=${tempStoreMeta} />`
    })
  }

  return html`<div class="UppyDashboardFileCard" aria-hidden="${showFileCard ? 'false' : 'true'}">
    <div class="UppyDashboardContent-bar">
      <h2 class="UppyDashboardContent-title">Editing <span class="UppyDashboardContent-titleFile">${file.meta ? file.meta.name : file.name}</span></h2>
      <button class="UppyDashboardContent-back" title="Finish editing file"
              onclick=${done}>Done</button>
    </div>
    ${showFileCard
      ? html`<div class="UppyDashboardFileCard-inner">
          <div class="UppyDashboardFileCard-preview">
            ${file.preview
              ? html`<img alt="${file.name}" src="${file.preview}">`
              : html`<div class="UppyDashboardItem-previewIcon">${getIconByMime(file.type.general)}</div>`
            }
          </div>
          <div class="UppyDashboardFileCard-info">
            <input class="UppyDashboardFileCard-input" name="name" type="text" value="${file.meta.name}"
                   onkeyup=${tempStoreMeta} />
            ${renderMetaFields(file)}
          </div>
        </div>`
      : null
    }
    <button class="UppyButton--circular UppyDashboardFileCard-done" type="button"
            title="Finish editing file" onclick=${done}>${checkIcon()}</button>
    </div>`
}
