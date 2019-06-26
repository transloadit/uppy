/**
 * Checks if the browser supports Drag & Drop (not supported on mobile devices, for example).
 *
 * @returns {boolean}
 */
module.exports = function isDragDropSupported () {
  const div = document.createElement('div')

  if (!('draggable' in div) || !('ondragstart' in div && 'ondrop' in div)) {
    return false
  }

  if (!('FormData' in window)) {
    return false
  }

  if (!('FileReader' in window)) {
    return false
  }

  return true
}
