import { h } from 'preact'

type $TSFixMe = any

export default function StreamStatus({ streamActive, i18n }: $TSFixMe) {
  if (streamActive) {
    return (
      <div
        title={i18n('streamActive')}
        className="uppy-ScreenCapture-icon--stream uppy-ScreenCapture-icon--streamActive"
      >
        <svg
          aria-hidden="true"
          focusable="false"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path d="M0 0h24v24H0z" opacity=".1" fill="none" />
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm18-7H5v1.63c3.96 1.28 7.09 4.41 8.37 8.37H19V7zM1 10v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11zm20-7H3c-1.1 0-2 .9-2 2v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
        </svg>
      </div>
    )
  }
  return (
    <div
      title={i18n('streamPassive')}
      className="uppy-ScreenCapture-icon--stream"
    >
      <svg
        aria-hidden="true"
        focusable="false"
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <path d="M0 0h24v24H0z" opacity=".1" fill="none" />
        <path d="M0 0h24v24H0z" fill="none" />
        <path d="M21 3H3c-1.1 0-2 .9-2 2v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm0-4v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11z" />
      </svg>
    </div>
  )
}
