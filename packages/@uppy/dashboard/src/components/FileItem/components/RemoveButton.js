const { h } = require('preact')

const renderCrossIcon = () =>
  <svg aria-hidden="true" focusable="false" class="UppyIcon" width="18" height="18" viewBox="0 0 18 18">
    <path d="M9 0C4.034 0 0 4.034 0 9s4.034 9 9 9 9-4.034 9-9-4.034-9-9-9z" />
    <path fill="#FFF" d="M13 12.222l-.778.778L9 9.778 5.778 13 5 12.222 8.222 9 5 5.778 5.778 5 9 8.222 12.222 5l.778.778L9.778 9z" />
  </svg>

module.exports = function RemoveButton (props) {
  return (
    props.showRemoveButton &&
    <button class="uppy-DashboardItem-remove"
      type="button"
      aria-label={props.i18n('removeFile')}
      title={props.i18n('removeFile')}
      onclick={() => props.removeFile(props.file.id)}
    >
      {renderCrossIcon()}
    </button>
  )
}
