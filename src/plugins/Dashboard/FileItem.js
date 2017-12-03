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

  const isProcessing = file.progress.preprocess || file.progress.postprocess
  const isUploaded = file.progress.uploadComplete && !isProcessing && !file.error
  const uploadInProgressOrComplete = file.progress.uploadStarted || isProcessing
  const uploadInProgress = (file.progress.uploadStarted && !file.progress.uploadComplete) || isProcessing
  const isPaused = file.isPaused || false
  const error = file.error || false

  const fileName = getFileNameAndExtension(file.meta.name).name
  const truncatedFileName = props.isWide ? truncateString(fileName, 15) : fileName

  const onPauseResumeCancelRetry = (ev) => {
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
  }

  return html`<li class="UppyDashboardItem
                        ${uploadInProgress ? 'is-inprogress' : ''}
                        ${isProcessing ? 'is-processing' : ''}
                        ${isUploaded ? 'is-complete' : ''}
                        ${isPaused ? 'is-paused' : ''}
                        ${error ? 'is-error' : ''}
                        ${props.resumableUploads ? 'is-resumable' : ''}"
                  id="uppy_${file.id}"
                  title="${file.meta.name}">
      <div class="UppyDashboardItem-preview">
        <div class="UppyDashboardItem-previewInnerWrap" style="background-color: ${getFileTypeIcon(file.type).color}">
          ${file.preview
            ? html`<img alt="${file.name}" src="${file.preview}">`
            : html`<div class="UppyDashboardItem-previewIconWrap">
                <span class="UppyDashboardItem-previewIcon" style="color: ${getFileTypeIcon(file.type).color}">${getFileTypeIcon(file.type).icon}</span>
                <svg class="UppyDashboardItem-previewIconBg" width="72" height="93" viewBox="0 0 72 93"><g><path d="M24.08 5h38.922A2.997 2.997 0 0 1 66 8.003v74.994A2.997 2.997 0 0 1 63.004 86H8.996A2.998 2.998 0 0 1 6 83.01V22.234L24.08 5z" fill="#FFF"/><path d="M24 5L6 22.248h15.007A2.995 2.995 0 0 0 24 19.244V5z" fill="#E4E4E4"/></g></svg>
              </div>`
          }
        </div>
        <div class="UppyDashboardItem-progress">
          ${isUploaded
            ? html`<div class="UppyDashboardItem-progressIndicator">
                ${FileItemProgress({
                  progress: file.progress.percentage,
                  fileID: file.id
                })}
              </div>`
            : html`<button class="UppyDashboardItem-progressIndicator"
                    type="button"
                    title="${isUploaded
                            ? 'upload complete'
                            : props.resumableUploads
                              ? file.isPaused
                                ? 'resume upload'
                                : 'pause upload'
                              : 'cancel upload'
                          }"
                    onclick=${onPauseResumeCancelRetry}>
              ${error
                ? iconRetry()
                : FileItemProgress({
                  progress: file.progress.percentage,
                  fileID: file.id
                })
              }
            </button>`
          }
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
                 <svg aria-hidden="true" class="UppyIcon" width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                    <path stroke="#FFF" stroke-width="0.8px" fill-rule="nonzero" vector-effect="non-scaling-stroke" d="M30 1C14 1 1 14 1 30s13 29 29 29 29-13 29-29S46 1 30 1z" />
                    <path fill="#FFF" vector-effect="non-scaling-stroke" d="M42 39.667L39.667 42 30 32.333 20.333 42 18 39.667 27.667 30 18 20.333 20.333 18 30 27.667 39.667 18 42 20.333 32.333 30z"/>
                 </svg>
               </button>`
        : null
      }
    </div>
  </li>`
}
