export default function supportsMediaRecorder(): boolean {
  /* eslint-disable compat/compat */
  return (
    typeof MediaRecorder === 'function' &&
    !!MediaRecorder.prototype &&
    typeof MediaRecorder.prototype.start === 'function'
  )
  /* eslint-enable compat/compat */
}
