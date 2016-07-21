import html from 'yo-yo'
import { fileIcon, checkIcon, removeIcon } from './icons'

export default function fileItem (bus, file) {
  const isUploaded = file.progress === 100
  const uploadInProgress = file.progress > 0 && file.progress < 100

  const remove = (ev) => {
    bus.emit('file-remove', file.id)
  }

  return html`<li class="UppyDashboardItem"
                  id="${file.id}"
                  title="${file.name}">
    <div class="UppyDashboardItem-icon">
      ${file.type.general === 'image' ? file.previewEl : fileIcon(file.type)}
    </div>
    <h4 class="UppyDashboardItem-name">
      ${file.uploadURL
        ? html`<a href="${file.uploadURL}" target="_blank">${file.name}</a>`
        : html`<span>${file.name}</span>`
      }
      <br>
    </h4>
    <div class="UppyDashboardItem-status">
      <div class="UppyDashboardItem-statusSize">${file.totalSize}</div>
      ${uploadInProgress ? 'Uploading… ' + file.progress + '%' : ''}
      ${isUploaded ? 'Completed' : ''}
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
    <div class="UppyDashboardItem-progress ${uploadInProgress ? 'is-active' : ''}">
      <div class="UppyDashboardItem-progressInner" style="width: ${file.progress}%"></div>
    </div>
  </li>`
}
