export default function supportsMediaRecorder(): boolean {
  return (
    typeof MediaRecorder === 'function' &&
    typeof MediaRecorder.prototype?.start === 'function'
  )
}
