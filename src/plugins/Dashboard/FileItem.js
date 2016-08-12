import html from '../../core/html'
import Utils from '../../core/Utils'
import prettyBytes from 'pretty-bytes'
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

function getETA (fileProgress) {
  if (!fileProgress.bytesUploaded) return 0

  const uploadSpeed = getSpeed(fileProgress)
  const bytesRemaining = fileProgress.bytesTotal - fileProgress.bytesUploaded
  const secondsRemaining = Math.round(bytesRemaining / uploadSpeed * 10) / 10

  const time = Utils.secondsToTime(secondsRemaining)

  // Only display hours and minutes if they are greater than 0 but always
  // display minutes if hours is being displayed
  const hoursStr = time.hours ? time.hours + 'h' : ''
  const minutesStr = (time.hours || time.minutes) ? time.minutes + 'm' : ''
  const secondsStr = time.seconds + 's'

  return `${hoursStr} ${minutesStr} ${secondsStr}`
}

function getSpeed (fileProgress) {
  if (!fileProgress.bytesUploaded) return 0

  const timeElapsed = (new Date()) - fileProgress.uploadStarted
  const uploadSpeed = fileProgress.bytesUploaded / (timeElapsed / 1000)
  return uploadSpeed
}

export default function fileItem (file, bus) {
  const isUploaded = file.progress.percentage === 100
  const uploadInProgressOrComplete = file.progress.percentage > 0
  const uploadInProgress = file.progress.percentage > 0 && file.progress.percentage < 100
  const isPaused = file.isPaused || false

  const fileName = Utils.getFileNameAndExtension(file.meta.name)[0]
  const truncatedFileName = Utils.truncateString(fileName, 15)

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
            if (file.progress.percentage === 100) return
            bus.emit('core:upload-pause', file.id)
          }}>
            ${FileItemProgress({progress: file.progress.percentage, fileID: file.id}, bus)}
          </button>
          <div class="UppyDashboardItem-progressInfo">
            ${getETA(file.progress)} ・ ↑ ${prettyBytes(getSpeed(file.progress))} / s
          </div>
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
        <span class="UppyDashboardItem-statusSize">${file.data.size ? prettyBytes(file.data.size) : '?'}</span>
      </div>
      ${!uploadInProgressOrComplete
        ? html`<button class="UppyDashboardItem-edit"
              onclick=${(e) => bus.emit('dashboard:file-card', file.id)}>${iconEdit()}</button>`
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
