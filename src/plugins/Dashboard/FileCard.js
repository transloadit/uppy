const html = require('yo-yo')
const getFileTypeIcon = require('./getFileTypeIcon')
const { checkIcon } = require('./icons')

module.exports = function fileCard (props) {
  const file = props.fileCardFor ? props.files[props.fileCardFor] : false
  const meta = {}

  function tempStoreMeta (ev) {
    const value = ev.target.value
    const name = ev.target.attributes.name.value
    meta[name] = value
  }

  function renderMetaFields (file) {
    const metaFields = props.metaFields || []
    return metaFields.map((field) => {
      return html`<fieldset class="UppyDashboardFileCard-fieldset">
        <label class="UppyDashboardFileCard-label">${field.name}</label>
        <input class="UppyDashboardFileCard-input"
               name="${field.id}"
               type="text"
               value="${file.meta[field.id]}"
               placeholder="${field.placeholder || ''}"
               onkeyup=${tempStoreMeta} /></fieldset>`
    })
  }

  return html`<div class="UppyDashboardFileCard" aria-hidden="${!props.fileCardFor}">
    <div class="UppyDashboardContent-bar">
      <h2 class="UppyDashboardContent-title">Editing <span class="UppyDashboardContent-titleFile">${file.meta ? file.meta.name : file.name}</span></h2>
      <button class="UppyDashboardContent-back" type="button" title="Finish editing file"
              onclick=${() => props.done(meta, file.id)}>Done</button>
    </div>
    ${props.fileCardFor
      ? html`<div class="UppyDashboardFileCard-inner">
          <div class="UppyDashboardFileCard-preview" style="background-color: ${getFileTypeIcon(file.type.general, file.type.specific).color}">
            ${file.preview
              ? html`<img alt="${file.name}" src="${file.preview}">`
              : html`<div class="UppyDashboardItem-previewIconWrap">
                <span class="UppyDashboardItem-previewIcon" style="color: ${getFileTypeIcon(file.type.general, file.type.specific).color}">${getFileTypeIcon(file.type.general, file.type.specific).icon}</span>
                <svg class="UppyDashboardItem-previewIconBg" width="72" height="93" viewBox="0 0 72 93"><g><path d="M24.08 5h38.922A2.997 2.997 0 0 1 66 8.003v74.994A2.997 2.997 0 0 1 63.004 86H8.996A2.998 2.998 0 0 1 6 83.01V22.234L24.08 5z" fill="#FFF"/><path d="M24 5L6 22.248h15.007A2.995 2.995 0 0 0 24 19.244V5z" fill="#E4E4E4"/></g></svg>
              </div>`
            }
          </div>
          <div class="UppyDashboardFileCard-info">
            <fieldset class="UppyDashboardFileCard-fieldset">
              <label class="UppyDashboardFileCard-label">Name</label>
              <input class="UppyDashboardFileCard-input" name="name" type="text" value="${file.meta.name}"
                     onkeyup=${tempStoreMeta} />
            </fieldset>
            ${renderMetaFields(file)}
          </div>
        </div>`
      : null
    }
    <div class="UppyDashboard-actions">
      <button class="UppyButton--circular UppyButton--blue UppyDashboardFileCard-done"
              type="button"
              title="Finish editing file"
              onclick=${() => props.done(meta, file.id)}>${checkIcon()}</button>
    </div>
    </div>`
}
