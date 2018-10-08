const { h } = require('preact')

function DashboardContentTitle (props) {
  if (props.newFiles.length) {
    return props.i18n('xFilesSelected', { smart_count: props.newFiles.length })
  }
}

function PanelTopBar (props) {
  let { allowNewUpload } = props.allowNewUpload
  // TODO maybe this should be done in ../index.js, then just pass that down as `allowNewUpload`
  if (allowNewUpload && props.maxNumberOfFiles) {
    allowNewUpload = props.totalFileCount < props.maxNumberOfFiles
  }

  return (
    <div class="uppy-DashboardContent-bar">
      <button class="uppy-DashboardContent-back"
        type="button"
        onclick={props.cancelAll}>{props.i18n('cancel')}</button>
      <div class="uppy-DashboardContent-title" role="heading" aria-level="h1">
        <DashboardContentTitle {...props} />
      </div>
      { allowNewUpload &&
        <button class="uppy-DashboardContent-addMore"
          type="button"
          aria-label={props.i18n('addMoreFiles')}
          title={props.i18n('addMoreFiles')}
          onclick={() => props.toggleAddFilesPanel(true)}>
          <svg class="UppyIcon" width="15" height="15" viewBox="0 0 13 13" version="1.1" xmlns="http://www.w3.org/2000/svg">
            <path d="M7,6 L13,6 L13,7 L7,7 L7,13 L6,13 L6,7 L0,7 L0,6 L6,6 L6,0 L7,0 L7,6 Z" />
          </svg>
        </button>
      }
    </div>
  )
}

module.exports = PanelTopBar
