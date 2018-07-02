const { h } = require('preact')
const AddFiles = require('./AddFiles')

const AddFilesPanel = (props) => {
  return (
    <div class="uppy-Dashboard-AddFilesPanel"
      hidden={!props.showAddFilesPanel}>
      <div class="uppy-DashboardContent-bar">
        <div class="uppy-DashboardContent-title" role="heading" aria-level="h1">
          {props.i18n('addingMoreFiles')}
        </div>
        <button class="uppy-DashboardContent-back"
          type="button"
          onclick={props.toggleAddFilesPanel}>{props.i18n('back')}</button>
      </div>
      <AddFiles {...props} />
    </div>
  )
}

module.exports = AddFilesPanel
