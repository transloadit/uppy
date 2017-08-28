const { h } = require('preact')
const hyperx = require('hyperx')
const html = hyperx(h, {attrToProp: false})

const RecordStartIcon = require('./RecordStartIcon')
const RecordStopIcon = require('./RecordStopIcon')

module.exports = function RecordButton ({ recording, onStartRecording, onStopRecording }) {
  if (recording) {
    return html`
      <button class="UppyButton--circular UppyButton--red UppyButton--sizeM UppyWebcam-recordButton"
        type="button"
        title="Stop Recording"
        aria-label="Stop Recording"
        onclick=${onStopRecording}>
        ${RecordStopIcon()}
      </button>
    `
  }

  return html`
    <button class="UppyButton--circular UppyButton--red UppyButton--sizeM UppyWebcam-recordButton"
      type="button"
      title="Begin Recording"
      aria-label="Begin Recording"
      onclick=${onStartRecording}>
      ${RecordStartIcon()}
    </button>
  `
}
