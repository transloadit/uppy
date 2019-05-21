module.exports = function isTouchDevice () {
  // works on most browsers
  if ('ontouchstart' in window) {
    return true
  }

  // works on IE10/11 and Surface
  // eslint-disable-next-line compat/compat
  return !!navigator.maxTouchPoints
}
