import type { I18n } from '@uppy/utils/lib/Translator'
import { h } from 'preact'

interface DiscardButtonProps {
  onDiscard: () => void
  i18n: I18n
}

export default function DiscardButton({
  onDiscard,
  i18n,
}: DiscardButtonProps): h.JSX.Element {
  return (
    <button
      className="uppy-u-reset uppy-c-btn uppy-ScreenCapture-button uppy-ScreenCapture-button--discard"
      type="button"
      title={i18n('discardMediaFile')}
      aria-label={i18n('discardMediaFile')}
      onClick={onDiscard}
      data-uppy-super-focusable
    >
      <svg
        aria-hidden="true"
        focusable="false"
        className="uppy-c-icon"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  )
}
