import html from '../../core/html'
import { getETA,
         getSpeed,
         prettyETA,
         getFileNameAndExtension,
         truncateString,
         copyToClipboard } from '../../core/Utils'
import prettyBytes from 'pretty-bytes'
import FileItemProgress from './FileItemProgress'
import { iconText, iconFile, iconAudio, iconEdit, iconCopy } from './icons'

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

export default function fileItem (props) {
  const file = props.file

  const isUploaded = file.progress.uploadComplete
  const uploadInProgressOrComplete = file.progress.uploadStarted
  const uploadInProgress = file.progress.uploadStarted && !file.progress.uploadComplete
  const isPaused = file.isPaused || false

  const fileName = getFileNameAndExtension(file.meta.name)[0]
  const truncatedFileName = props.isWide ? truncateString(fileName, 15) : fileName

  return html`<li class="UppyDashboardItem
                        ${uploadInProgress ? 'is-inprogress' : ''}
                        ${isUploaded ? 'is-complete' : ''}
                        ${isPaused ? 'is-paused' : ''}
                        ${props.resumableUploads ? 'is-resumable' : ''}"
                  id="uppy_${file.id}"
                  title="${file.meta.name}">
      <div class="UppyDashboardItem-preview">
        ${file.preview
          ? html`<img alt="${file.name}" src="${file.preview}">`
          : html`<div class="UppyDashboardItem-previewIcon">
              ${getIconByMime(file.type.general)}
            </div>`
        }
        <div class="UppyDashboardItem-progress">
          <button class="UppyDashboardItem-progressBtn"
                  title="${isUploaded
                          ? 'upload complete'
                          : props.resumableUploads
                            ? file.isPaused
                              ? 'resume upload'
                              : 'pause upload'
                            : 'cancel upload'
                        }"
                  onclick=${(ev) => {
                    if (isUploaded) return
                    if (props.resumableUploads) {
                      props.pauseUpload(file.id)
                    } else {
                      props.cancelUpload(file.id)
                    }
                  }}>
            ${FileItemProgress({
              progress: file.progress.percentage,
              fileID: file.id
            })}
          </button>
          ${props.showProgressDetails
            ? html`<div class="UppyDashboardItem-progressInfo"
                        title="${props.i18n('fileProgress')}"
                        aria-label="${props.i18n('fileProgress')}">
                ${!file.isPaused && !isUploaded
                  ? html`<span>${prettyETA(getETA(file.progress))} ・ ↑ ${prettyBytes(getSpeed(file.progress))}/s</span>`
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
                 <svg class="UppyIcon" width="22" height="21" viewBox="0 0 18 17">
                   <ellipse fill="#424242" cx="8.62" cy="8.383" rx="8.62" ry="8.383"/>
                   <path stroke="#FFF" fill="#FFF" d="M11 6.147L10.85 6 8.5 8.284 6.15 6 6 6.147 8.35 8.43 6 10.717l.15.146L8.5 8.578l2.35 2.284.15-.146L8.65 8.43z"/>
                 </svg>
               </button>`
        : null
      }
    </div>
  </li>`
}
