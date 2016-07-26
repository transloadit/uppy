import html from 'yo-yo'
import Utils from '../../core/Utils'
import { checkIcon, removeIcon, iconText, iconFile, iconAudio } from './icons'

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

export default function fileItem (bus, file) {
  const isUploaded = file.progress === 100
  const uploadInProgress = file.progress > 0 && file.progress < 100

  function remove (ev) {
    const el = document.querySelector(`#${file.id}`)
    el.classList.add('UppyAnimation-zoomOutLeft')

    // this seems to be working in latest Chrome, Firefox and Safari,
    // but might not be 100% cross-browser, needs testing
    // https://davidwalsh.name/css-animation-callback
    el.addEventListener('animationend', () => {
      bus.emit('file-remove', file.id)
    })
    // bus.emit('file-remove', file.id)
  }

  const truncatedFileName = Utils.truncateString(file.name, 30)

  // <h5 class="UppyDashboardItem-previewType">${file.extension ? '.' + file.extension : '?'}</h5>

  return html`<li class="UppyDashboardItem"
                  id="${file.id}"
                  title="${file.name}">
      <div class="UppyDashboardItem-preview">
        ${file.previewEl
         ? file.previewEl
         : html`<div class="UppyDashboardItem-previewIcon">${getIconByMime(file.type.general)}</div>`
        }
        <div class="UppyDashboardItem-progress ${uploadInProgress ? 'is-active' : ''}">
          <div class="UppyDashboardItem-progressNum">${file.progress}%</div>
          <div class="UppyDashboardItem-progressInner" style="width: ${file.progress}%"></div>
        </div>
      </div>
    <div class="UppyDashboardItem-info">
      <h4 class="UppyDashboardItem-name">
        ${file.uploadURL
          ? html`<a href="${file.uploadURL}" target="_blank">${truncatedFileName}</a>`
          : truncatedFileName
        }
      </h4>
      <div class="UppyDashboardItem-status">
        <span class="UppyDashboardItem-statusSize">${file.totalSize}</span>
      </div>
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
