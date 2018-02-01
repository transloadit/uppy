const RecordStartIcon = require('./RecordStartIcon')
const RecordStopIcon = require('./RecordStopIcon')
const { h } = require('preact')

module.exports = function RecordButton ({ recording, onStartRecording, onStopRecording }) {
  if (recording) {
    return (
      <button class="UppyButton--circular UppyButton--red UppyButton--sizeM uppy-Webcam-recordButton"
        type="button"
        title="Stop Recording"
        aria-label="Stop Recording"
        onclick={onStopRecording}>
        {RecordStopIcon()}
      </button>
    )
  }

  return (
    <button class="UppyButton--circular UppyButton--red UppyButton--sizeM uppy-Webcam-recordButton"
      type="button"
      title="Begin Recording"
      aria-label="Begin Recording"
      onclick={onStartRecording}>
      {RecordStartIcon()}
    </button>
  )
}
