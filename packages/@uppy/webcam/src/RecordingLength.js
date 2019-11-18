const { h } = require('preact')
const formatSeconds = require('./formatSeconds')

module.exports = function RecordingLength ({ recordingLengthSeconds }) {
  const formattedRecordingLengthSeconds = formatSeconds(recordingLengthSeconds)

  return (
    <div class="uppy-Webcam-recordingLength" title={formattedRecordingLengthSeconds} aria-label={formattedRecordingLengthSeconds}>
      {formattedRecordingLengthSeconds}
    </div>
  )
}
