import html from 'yo-yo'
import Utils from '../../core/Utils'
import { checkIcon, removeIcon, iconText, iconFile, iconAudio, iconEdit } from './icons'

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

export default function fileItem (file, bus) {
  const isUploaded = file.progress === 100
  const uploadInProgressOrComplete = file.progress > 0

  const fileName = Utils.getFileNameAndExtension(file.meta.name)[0]
  const truncatedFileName = Utils.truncateString(fileName, 30)

  function remove (ev) {
    const el = document.querySelector(`#uppy_${file.id}`)
    el.classList.add('UppyAnimation-zoomOutLeft')

    // this seems to be working in latest Chrome, Firefox and Safari,
    // but might not be 100% cross-browser, needs testing
    // https://davidwalsh.name/css-animation-callback
    el.addEventListener('animationend', () => {
      bus.emit('file-remove', file.id)
    })
    // bus.emit('file-remove', file.id)
  }

  function openFileCard (fileId) {
    bus.emit('file-card-open', fileId)
  }

  // <h5 class="UppyDashboardItem-previewType">${file.extension ? '.' + file.extension : '?'}</h5>

  return html`<li class="UppyDashboardItem"
                  id="uppy_${file.id}"
                  title="${file.meta.name}">
      <div class="UppyDashboardItem-preview">
        ${file.previewEl
         ? file.previewEl
         : html`<div class="UppyDashboardItem-previewIcon">${getIconByMime(file.type.general)}</div>`
        }
        <div class="UppyDashboardItem-progress ${uploadInProgressOrComplete ? 'is-active' : ''}">
          <div class="UppyDashboardItem-progressNum">${file.progress}%</div>
          <div class="UppyDashboardItem-progressInner" style="width: ${file.progress}%"></div>
        </div>
      </div>
    <div class="UppyDashboardItem-info">
      <h4 class="UppyDashboardItem-name">
        ${file.uploadURL
          ? html`<a href="${file.uploadURL}" target="_blank">${truncatedFileName}.${file.extension}</a>`
          : `${truncatedFileName}.${file.extension}`
        }
      </h4>
      <div class="UppyDashboardItem-status">
        <span class="UppyDashboardItem-statusSize">${file.totalSize}</span>
      </div>
      <button class="UppyDashboardItem-edit"
              onclick=${openFileCard.bind(this, file.id)}>${iconEdit()} Edit</button>
    </div>
    <div class="UppyDashboardItem-action">
      ${isUploaded
        ? checkIcon()
        : html`<button class="UppyDashboardItem-remove"
                       aria-label="Remove this file"
                       onclick=${remove}>
                  ${removeIcon()}
               </button>`
      }
    </div>
  </li>`
}
