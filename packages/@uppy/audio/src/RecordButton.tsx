import type { I18n } from '@uppy/utils/lib/Translator'
import { h } from 'preact'

interface RecordButtonProps {
  recording: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  i18n: I18n
}

export default function RecordButton({
  recording,
  onStartRecording,
  onStopRecording,
  i18n,
}: RecordButtonProps) {
  if (recording) {
    return (
      <button
        className="uppy-u-reset uppy-c-btn uppy-Audio-button"
        type="button"
        title={i18n('stopAudioRecording')}
        aria-label={i18n('stopAudioRecording')}
        onClick={onStopRecording}
        data-uppy-super-focusable
      >
        <svg
          aria-hidden="true"
          focusable="false"
          className="uppy-c-icon"
          width="100"
          height="100"
          viewBox="0 0 100 100"
        >
          <rect x="15" y="15" width="70" height="70" />
        </svg>
      </button>
    )
  }

  return (
    <button
      className="uppy-u-reset uppy-c-btn uppy-Audio-button"
      type="button"
      title={i18n('startAudioRecording')}
      aria-label={i18n('startAudioRecording')}
      onClick={onStartRecording}
      data-uppy-super-focusable
    >
      <svg
        aria-hidden="true"
        focusable="false"
        className="uppy-c-icon"
        width="14px"
        height="20px"
        viewBox="0 0 14 20"
      >
        <path
          d="M7 14c2.21 0 4-1.71 4-3.818V3.818C11 1.71 9.21 0 7 0S3 1.71 3 3.818v6.364C3 12.29 4.79 14 7 14zm6.364-7h-.637a.643.643 0 0 0-.636.65V9.6c0 3.039-2.565 5.477-5.6 5.175-2.645-.264-4.582-2.692-4.582-5.407V7.65c0-.36-.285-.65-.636-.65H.636A.643.643 0 0 0 0 7.65v1.631c0 3.642 2.544 6.888 6.045 7.382v1.387H3.818a.643.643 0 0 0-.636.65v.65c0 .36.285.65.636.65h6.364c.351 0 .636-.29.636-.65v-.65c0-.36-.285-.65-.636-.65H7.955v-1.372C11.363 16.2 14 13.212 14 9.6V7.65c0-.36-.285-.65-.636-.65z"
          fill="#FFF"
          fill-rule="nonzero"
        />
      </svg>
    </button>
  )
}
