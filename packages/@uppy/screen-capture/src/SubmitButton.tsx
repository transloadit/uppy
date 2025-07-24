import type { I18n } from '@uppy/utils/lib/Translator'
import { h } from 'preact'

interface SubmitButtonProps {
  recording: boolean
  recordedVideo: string | null
  onSubmit: () => void
  i18n: I18n
  capturedScreenshotUrl?: string | null
}

/**
 * Submit recorded video to uppy. Enabled when file is available
 */
export default function SubmitButton({
  recording,
  recordedVideo,
  onSubmit,
  capturedScreenshotUrl,
  i18n,
}: SubmitButtonProps): h.JSX.Element | null {
  if ((recordedVideo || capturedScreenshotUrl) && !recording) {
    return (
      <button
        className="uppy-u-reset uppy-c-btn uppy-ScreenCapture-button uppy-ScreenCapture-button--submit"
        type="button"
        title={i18n('submitRecordedFile')}
        aria-label={i18n('submitRecordedFile')}
        onClick={onSubmit}
        data-uppy-super-focusable
      >
        <svg
          width="12"
          height="9"
          viewBox="0 0 12 9"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
          className="uppy-c-icon"
        >
          <path
            fill="#fff"
            fillRule="nonzero"
            d="M10.66 0L12 1.31 4.136 9 0 4.956l1.34-1.31L4.136 6.38z"
          />
        </svg>
      </button>
    )
  }
  return null
}
