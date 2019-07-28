const { h } = require('preact')

/**
 * Submit recorded video to uppy. Enabled when file is available
 */
module.exports = function SubmitButton ({ recording, recordedVideo, onSubmit, i18n }) {
  if (recordedVideo && !recording) {
    return (
      <button class="uppy-u-reset uppy-c-btn uppy-Capture-button uppy-Capture-button--video submit"
        style={{ marginLeft: '1rem' }}
        type="button"
        title={i18n('submitRecordedFile')}
        aria-label={i18n('submitRecordedFile')}
        onclick={onSubmit}
        data-uppy-super-focusable>
        <svg aria-hidden="true" focusable="false" class="UppyIcon" width="24" height="24" viewBox="0 0 24 24">
          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
        </svg>
      </button>
    )
  } else {
    return null
  }
}
