import { h } from 'preact'
import formatSeconds from './formatSeconds.js'

interface RecordingLengthProps {
  recordingLengthSeconds: number
}

export default function RecordingLength({
  recordingLengthSeconds,
}: RecordingLengthProps) {
  const formattedRecordingLengthSeconds = formatSeconds(recordingLengthSeconds)

  return <span>{formattedRecordingLengthSeconds}</span>
}
