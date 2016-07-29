import html from 'yo-yo'
import { iconText, iconFile, iconAudio } from './icons'

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

export default function fileCard (file, bus, updateMeta) {
  const meta = {}

  function tempStoreMeta (ev) {
    const value = ev.target.value
    const name = ev.target.attributes.name.value
    meta[name] = value
  }

  function done () {
    updateMeta(meta, file.id)
    bus.emit('file-card-close')
  }

  const previewEl = file.preview ? html`<img alt="${file.name}" src="${file.preview}">` : null

  return html`<div class="UppyDashboardFileCard">
    <div class="UppyDashboardFileCard-preview">
      ${previewEl ||
        html`<div class="UppyDashboardItem-previewIcon">${getIconByMime(file.type.general)}</div>`
      }
    </div>
    <div class="UppyDashboardFileCard-info">
      <input class="UppyDashboardFileCard-input" name="name" type="text" value="${file.meta.name}" onkeyup=${tempStoreMeta} />
      <input class="UppyDashboardFileCard-input" name="something" type="text" value="${file.meta.something || ''}" placeholder="something" onkeyup=${tempStoreMeta} />
      <button onclick=${done}>Done</button>
    </div>
  </div>`
}
