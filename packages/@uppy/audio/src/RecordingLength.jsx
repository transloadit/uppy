import { h } from 'preact'
import formatSeconds from './formatSeconds.js'

export default function RecordingLength ({ recordingLengthSeconds, i18n }) {
  const formattedRecordingLengthSeconds = formatSeconds(recordingLengthSeconds)

  return (
    <span aria-label={i18n('recordingLength', { recording_length: formattedRecordingLengthSeconds })}>
      {formattedRecordingLengthSeconds}
    </span>
  )
}
