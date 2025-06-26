export default function supportsMediaRecorder(): boolean {
  return (
    typeof MediaRecorder === 'function' &&
    !!MediaRecorder.prototype &&
    typeof MediaRecorder.prototype.start === 'function'
  )
}
