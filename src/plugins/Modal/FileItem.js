import html from 'yo-yo'
import Utils from '../../core/Utils'
import FileItemProgress from './FileItemProgress'
import { removeIcon, iconText, iconFile, iconAudio, iconEdit } from './icons'

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
  const uploadInProgress = file.progress > 0 && file.progress < 100
  const isPaused = file.isPaused || false

  const fileName = Utils.getFileNameAndExtension(file.meta.name)[0]
  const truncatedFileName = Utils.truncateString(fileName, 20)

  function remove (ev) {
    // const el = document.querySelector(`#uppy_${file.id}`)
    // el.classList.add('UppyAnimation-zoomOutLeft')

    // this seems to be working in latest Chrome, Firefox and Safari,
    // but might not be 100% cross-browser, needs testing
    // https://davidwalsh.name/css-animation-callback
    // el.addEventListener('animationend', () => {
    //   bus.emit('file-remove', file.id)
    // })
    bus.emit('file-remove', file.id)
  }

  // <h5 class="UppyDashboardItem-previewType">${file.extension ? '.' + file.extension : '?'}</h5>
  // <div class="UppyDashboardItem-progressNum">${file.progress}%</div>
  // <div class="UppyDashboardItem-progressInner" style="width: ${file.progress}%"></div>

  return html`<li class="UppyDashboardItem ${uploadInProgress ? 'is-inprogress' : ''} ${isUploaded ? 'is-complete' : ''} ${isPaused ? 'is-paused' : ''}"
                  id="uppy_${file.id}"
                  title="${file.meta.name}">
      <div class="UppyDashboardItem-preview">
        ${file.preview
          ? html`<img alt="${file.name}" src="${file.preview}">`
          : getIconByMime(file.type.general)
        }
        <div class="UppyDashboardItem-progress">
          <button class="UppyDashboardItem-progressBtn" onclick=${(e) => {
            if (file.progress === 100) return
            bus.emit('core:upload-pause', file.id)
          }}>
            ${FileItemProgress({
              progress: file.progress,
              fileID: file.id
            }, bus)}
          </button>
        </div>
      </div>
    <div class="UppyDashboardItem-info">
      <h4 class="UppyDashboardItem-name">
        ${file.uploadURL
          ? html`<a href="${file.uploadURL}" target="_blank">${file.extension ? truncatedFileName + '.' + file.extension : truncatedFileName}</a>`
          : file.extension ? truncatedFileName + '.' + file.extension : truncatedFileName
        }
      </h4>
      <div class="UppyDashboardItem-status">
        <span class="UppyDashboardItem-statusSize">${file.totalSize}</span>
      </div>
      ${!uploadInProgressOrComplete
        ? html`<button class="UppyDashboardItem-edit"
              onclick=${(e) => bus.emit('file-card-open', file.id)}>${iconEdit()}</button>`
        : null
      }
    </div>
    <div class="UppyDashboardItem-action">
      ${!isUploaded
        ? html`<button class="UppyDashboardItem-remove"
                       aria-label="Remove this file"
                       onclick=${remove}>
                  ${removeIcon()}
               </button>`
        : null
      }
    </div>
  </li>`
}
