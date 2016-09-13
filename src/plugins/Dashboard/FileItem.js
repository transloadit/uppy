import html from '../../core/html'
import { secondsToTime,
         getFileNameAndExtension,
         truncateString,
         copyToClipboard } from '../../core/Utils'
import prettyBytes from 'pretty-bytes'
import FileItemProgress from './FileItemProgress'
import { removeIcon, iconText, iconFile, iconAudio, iconEdit, iconCopy } from './icons'

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

  const time = secondsToTime(secondsRemaining)

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

export default function fileItem (props) {
  const file = props.file

  const isUploaded = file.progress.uploadComplete
  const uploadInProgressOrComplete = file.progress.uploadStarted
  const uploadInProgress = file.progress.uploadStarted && !file.progress.uploadComplete
  const isPaused = file.isPaused || false

  const fileName = getFileNameAndExtension(file.meta.name)[0]
  const truncatedFileName = truncateString(fileName, 15)

  return html`<li class="UppyDashboardItem
                        ${uploadInProgress ? 'is-inprogress' : ''}
                        ${isUploaded ? 'is-complete' : ''}
                        ${isPaused ? 'is-paused' : ''}"
                  id="uppy_${file.id}"
                  title="${file.meta.name}">
      <div class="UppyDashboardItem-preview">
        ${file.preview
          ? html`<img alt="${file.name}" src="${file.preview}">`
          : getIconByMime(file.type.general)
        }
        <div class="UppyDashboardItem-progress">
          <button class="UppyDashboardItem-progressBtn"
                  title="${isUploaded
                          ? 'upload complete'
                          : file.isPaused ? 'resume upload' : 'pause upload'}"
                  onclick=${(ev) => {
                    if (isUploaded) return
                    props.pauseUpload(file.id)
                  }}>
            ${FileItemProgress({
              progress: file.progress.percentage,
              fileID: file.id
            })}
          </button>
          ${props.showProgressDetails
            ? html`<div class="UppyDashboardItem-progressInfo"
                   title="${props.i18n('localDisk')}"
                   aria-label="${props.i18n('localDisk')}">
                ${!file.isPaused && !isUploaded
                  ? html`<span>${getETA(file.progress)} ・ ↑ ${prettyBytes(getSpeed(file.progress))}/s</span>`
                  : null
                }
              </div>`
            : null
          }
        </div>
      </div>
    <div class="UppyDashboardItem-info">
      <h4 class="UppyDashboardItem-name" title="${fileName}">
        ${file.uploadURL
          ? html`<a href="${file.uploadURL}" target="_blank">
              ${file.extension ? truncatedFileName + '.' + file.extension : truncatedFileName}
            </a>`
          : file.extension ? truncatedFileName + '.' + file.extension : truncatedFileName
        }
      </h4>
      <div class="UppyDashboardItem-status">
        <span class="UppyDashboardItem-statusSize">${file.data.size ? prettyBytes(file.data.size) : '?'}</span>
      </div>
      ${!uploadInProgressOrComplete
        ? html`<button class="UppyDashboardItem-edit"
                       aria-label="Edit file"
                       title="Edit file"
                       onclick=${(e) => props.showFileCard(file.id)}>
                        ${iconEdit()}</button>`
        : null
      }
      ${file.uploadURL
        ? html`<button class="UppyDashboardItem-copyLink"
                       aria-label="Copy link"
                       title="Copy link"
                       onclick=${() => {
                         copyToClipboard(file.uploadURL, props.i18n('copyLinkToClipboardFallback'))
                          .then(() => {
                            props.log('Link copied to clipboard.')
                            props.info(props.i18n('copyLinkToClipboardSuccess'), 'info', 3000)
                          })
                          .catch(props.log)
                       }}>${iconCopy()}</button>`
        : null
      }
    </div>
    <div class="UppyDashboardItem-action">
      ${!isUploaded
        ? html`<button class="UppyDashboardItem-remove"
                       aria-label="Remove file"
                       title="Remove file"
                       onclick=${() => props.removeFile(file.id)}>
                  ${removeIcon()}
               </button>`
        : null
      }
    </div>
  </li>`
}
