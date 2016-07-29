import html from 'yo-yo'
import FileItem from './FileItem'
import { uploadIcon, dashboardBgIcon } from './icons'

function Dashboard (files, bus, autoProceed) {
  const next = (ev) => {
    bus.emit('next')
  }

  const selectedFiles = Object.keys(files).filter((file) => {
    return files[file].progress !== 100
  })
  const totalFileCount = Object.keys(files).length
  const selectedFileCount = Object.keys(selectedFiles).length
  const isSomethingSelected = selectedFileCount > 0

  return html`<div class="UppyDashboard-fileContainer">
    ${totalFileCount === 0
      ? html`<div class="UppyDashboard-bgIcon">${dashboardBgIcon()}</div>`
      : ''}
    <ul class="UppyDashboard-list">
      ${Object.keys(files).map((fileID) => {
        return FileItem(bus, files[fileID])
      })}
    </ul>
    ${!autoProceed && isSomethingSelected
      ? html`<button class="UppyDashboard-upload"
                     type="button"
                     title="Upload"
                     onclick=${next}>
                ${uploadIcon()}
                <sup class="UppyDashboard-uploadCount">${selectedFileCount}</sup>
             </button>`
      : null
    }
  </div>`
}

export default Dashboard
