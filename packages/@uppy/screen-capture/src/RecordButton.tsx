import type { I18n } from '@uppy/utils/lib/Translator'
import { h } from 'preact'

interface RecordButtonProps {
  recording: boolean | undefined
  onStartRecording: () => void
  onStopRecording: () => Promise<void>
  i18n: I18n
}

/**
 * Control screen capture recording. Will show record or stop button.
 */
export default function RecordButton({
  recording,
  onStartRecording,
  onStopRecording,
  i18n,
}: RecordButtonProps): h.JSX.Element {
  if (recording) {
    return (
      <button
        className="uppy-u-reset uppy-c-btn uppy-ScreenCapture-button uppy-ScreenCapture-button--video uppy-ScreenCapture-button--stop-rec"
        type="button"
        title={i18n('stopCapturing')}
        aria-label={i18n('stopCapturing')}
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
      className="uppy-u-reset uppy-c-btn uppy-ScreenCapture-button uppy-ScreenCapture-button--video"
      type="button"
      title={i18n('startCapturing')}
      aria-label={i18n('startCapturing')}
      onClick={onStartRecording}
      data-uppy-super-focusable
    >
      <svg
        aria-hidden="true"
        focusable="false"
        className="uppy-c-icon"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
      </svg>
    </button>
  )
}
