const { h } = require('preact')

module.exports = function RecordButton ({ recording, onStartRecording, onStopRecording, i18n }) {
  if (recording) {
    return (
      <button
        class="uppy-u-reset uppy-c-btn uppy-Webcam-button uppy-Webcam-button--video"
        type="button"
        title={i18n('stopRecording')}
        aria-label={i18n('stopRecording')}
        onclick={onStopRecording}
        data-uppy-super-focusable
      >
        <svg aria-hidden="true" focusable="false" class="uppy-c-icon" width="100" height="100" viewBox="0 0 100 100">
          <rect x="15" y="15" width="70" height="70" />
        </svg>
      </button>
    )
  }

  return (
    <button
      class="uppy-u-reset uppy-c-btn uppy-Webcam-button uppy-Webcam-button--video"
      type="button"
      title={i18n('startRecording')}
      aria-label={i18n('startRecording')}
      onclick={onStartRecording}
      data-uppy-super-focusable
    >
      <svg aria-hidden="true" focusable="false" class="uppy-c-icon" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" />
      </svg>
    </button>
  )
}
