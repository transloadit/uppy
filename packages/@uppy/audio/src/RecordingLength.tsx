import { h } from 'preact'
import type { Uppy } from '@uppy/core'
import formatSeconds from './formatSeconds.ts'

interface RecordingLengthProps {
  recordingLengthSeconds: number
  i18n: Uppy<any, any>['i18n']
}

export default function RecordingLength({
  recordingLengthSeconds,
  i18n,
}: RecordingLengthProps): JSX.Element {
  const formattedRecordingLengthSeconds = formatSeconds(recordingLengthSeconds)

  return (
    <span
      aria-label={i18n('recordingLength', {
        recording_length: formattedRecordingLengthSeconds,
      })}
    >
      {formattedRecordingLengthSeconds}
    </span>
  )
}
