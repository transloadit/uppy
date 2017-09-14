const html = require('yo-yo')
const { getETA,
         getSpeed,
         prettyETA,
         getFileNameAndExtension,
         truncateString,
         copyToClipboard } = require('../../core/Utils')
const prettyBytes = require('prettier-bytes')
const FileItemProgress = require('./FileItemProgress')
const getFileTypeIcon = require('./getFileTypeIcon')
const { iconEdit, iconCopy, iconRetry } = require('./icons')

module.exports = function fileItem (props) {
  const file = props.file
  const acquirers = props.acquirers

  const isUploaded = file.progress.uploadComplete
  const uploadInProgressOrComplete = file.progress.uploadStarted
  const uploadInProgress = file.progress.uploadStarted && !file.progress.uploadComplete
  const isPaused = file.isPaused || false
  const error = file.error || false

  const fileName = getFileNameAndExtension(file.meta.name)[0]
  const truncatedFileName = props.isWide ? truncateString(fileName, 15) : fileName

  return html`<li class="UppyDashboardItem
                        ${uploadInProgress ? 'is-inprogress' : ''}
                        ${isUploaded ? 'is-complete' : ''}
                        ${isPaused ? 'is-paused' : ''}
                        ${error ? 'is-error' : ''}
                        ${props.resumableUploads ? 'is-resumable' : ''}"
                  id="uppy_${file.id}"
                  title="${file.meta.name}">
      <div class="UppyDashboardItem-preview">
        <div class="UppyDashboardItem-previewInnerWrap" style="background-color: ${getFileTypeIcon(file.type.general, file.type.specific).color}">
          ${file.preview
            ? html`<img alt="${file.name}" src="${file.preview}">`
            : html`<div class="UppyDashboardItem-previewIconWrap">
                <span class="UppyDashboardItem-previewIcon" style="color: ${getFileTypeIcon(file.type.general, file.type.specific).color}">${getFileTypeIcon(file.type.general, file.type.specific).icon}</span>
                <svg class="UppyDashboardItem-previewIconBg" width="72" height="93" viewBox="0 0 72 93"><g><path d="M24.08 5h38.922A2.997 2.997 0 0 1 66 8.003v74.994A2.997 2.997 0 0 1 63.004 86H8.996A2.998 2.998 0 0 1 6 83.01V22.234L24.08 5z" fill="#FFF"/><path d="M24 5L6 22.248h15.007A2.995 2.995 0 0 0 24 19.244V5z" fill="#E4E4E4"/></g></svg>
              </div>`
          }
        </div>
        <div class="UppyDashboardItem-progress">
          <button class="UppyDashboardItem-progressBtn"
                  type="button"
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
                    if (error) {
                      props.retryUpload(file.id)
                      return
                    }
                    if (props.resumableUploads) {
                      props.pauseUpload(file.id)
                    } else {
                      props.cancelUpload(file.id)
                    }
                  }}>
            ${props.file.error
              ? iconRetry()
              : FileItemProgress({
                progress: file.progress.percentage,
                fileID: file.id
              })
            }
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
        ${file.data.size && html`<div class="UppyDashboardItem-statusSize">${prettyBytes(file.data.size)}</div>`}
        ${file.source && html`<div class="UppyDashboardItem-sourceIcon">
            ${acquirers.map(acquirer => {
              if (acquirer.id === file.source) return html`<span title="${props.i18n('fileSource')}: ${acquirer.name}">${acquirer.icon()}</span>`
            })}
          </div>`
        }
      </div>
      ${!uploadInProgressOrComplete
        ? html`<button class="UppyDashboardItem-edit"
                       type="button"
                       aria-label="Edit file"
                       title="Edit file"
                       onclick=${(e) => props.showFileCard(file.id)}>
                        ${iconEdit()}</button>`
        : null
      }
      ${file.uploadURL
        ? html`<button class="UppyDashboardItem-copyLink"
                       type="button"
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
                       type="button"
                       aria-label="Remove file"
                       title="Remove file"
                       onclick=${() => props.removeFile(file.id)}>
                 <svg class="UppyIcon" width="22" height="21" viewBox="0 0 18 17">
                   <ellipse cx="8.62" cy="8.383" rx="8.62" ry="8.383"/>
                   <path stroke="#FFF" fill="#FFF" d="M11 6.147L10.85 6 8.5 8.284 6.15 6 6 6.147 8.35 8.43 6 10.717l.15.146L8.5 8.578l2.35 2.284.15-.146L8.65 8.43z"/>
                 </svg>
               </button>`
        : null
      }
    </div>
  </li>`
}
