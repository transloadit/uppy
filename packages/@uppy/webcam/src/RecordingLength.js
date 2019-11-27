const { h } = require('preact')
const formatSeconds = require('./formatSeconds')

module.exports = function RecordingLength ({ recordingLengthSeconds, i18n }) {
  const formattedRecordingLengthSeconds = formatSeconds(recordingLengthSeconds)

  return (
    <div class="uppy-Webcam-recordingLength" aria-label={i18n('recordingLength', { recording_length: formattedRecordingLengthSeconds })}>
      {formattedRecordingLengthSeconds}
    </div>
  )
}
