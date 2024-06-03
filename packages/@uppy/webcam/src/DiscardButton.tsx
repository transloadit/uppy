import type { I18n } from '@uppy/utils/lib/Translator'
import { h } from 'preact'

interface DiscardButtonProps {
  onDiscard: () => void
  i18n: I18n
}

function DiscardButton({ onDiscard, i18n }: DiscardButtonProps) {
  return (
    <button
      className="uppy-u-reset uppy-c-btn uppy-Webcam-button uppy-Webcam-button--discard"
      type="button"
      title={i18n('discardRecordedFile')}
      aria-label={i18n('discardRecordedFile')}
      onClick={onDiscard}
      data-uppy-super-focusable
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 13 13"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
        className="uppy-c-icon"
      >
        <g fill="#FFF" fillRule="evenodd">
          <path d="M.496 11.367L11.103.76l1.414 1.414L1.911 12.781z" />
          <path d="M11.104 12.782L.497 2.175 1.911.76l10.607 10.606z" />
        </g>
      </svg>
    </button>
  )
}

export default DiscardButton
