const { h } = require('preact')

/**
 * Control screen capture recording. Will show record or stop button.
 */
module.exports = function RecordButton ({ recording, onStartRecording, onStopRecording, i18n }) {
  if (recording) {
    return (
      <button class="uppy-u-reset uppy-c-btn uppy-Capture-button uppy-Capture-button--video uppy-Capture-button--stop-rec"
        type="button"
        title={i18n('stopRecording')}
        aria-label={i18n('stopRecording')}
        onclick={onStopRecording}
        focusable>
        <svg aria-hidden="true" focusable="false" class="UppyIcon" width="100" height="100" viewBox="0 0 100 100">
          <rect x="5" y="5" width="90" height="90" />
        </svg>
      </button>
    )
  }

  return (
    <button class="uppy-u-reset uppy-c-btn uppy-Capture-button uppy-Capture-button--video uppy-Capture-button--start-rec"
      type="button"
      title={i18n('startRecording')}
      aria-label={i18n('startRecording')}
      onclick={onStartRecording}
      focusable>
      <svg aria-hidden="true" focusable="false" class="UppyIcon" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50" />
      </svg>
    </button>
  )
}
