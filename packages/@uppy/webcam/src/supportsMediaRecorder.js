module.exports = function supportsMediaRecorder () {
  return typeof MediaRecorder === 'function' && !!MediaRecorder.prototype &&
    typeof MediaRecorder.prototype.start === 'function'
}
