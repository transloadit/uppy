import { h } from 'preact'

interface ScreenshotButtonProps {
  onScreenshot: () => void
  i18n: (key: string) => string
}

export default function ScreenshotButton({
  onScreenshot,
  i18n,
}: ScreenshotButtonProps) {
  return (
    <button
      className="uppy-u-reset uppy-c-btn uppy-ScreenCapture-button uppy-ScreenCapture-button--screenshot"
      type="button"
      title={i18n('takeScreenshot')}
      aria-label={i18n('takeScreenshot')}
      onClick={onScreenshot}
      data-uppy-super-focusable
    >
      <svg
        aria-hidden="true"
        focusable="false"
        className="uppy-c-icon"
        width="32"
        height="32"
        viewBox="0 0 32 32"
      >
        <path
          d="M27 9h-3.33l-2-2H13.33l-2 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h19c1.1 0 2-.9 2-2V11c0-1.1-.9-2-2-2zM17.5 19c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"
          fill="currentColor"
        />
      </svg>
    </button>
  )
}
