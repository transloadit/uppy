/**
 * Checks if the browser supports Drag & Drop (not supported on mobile devices, for example).
 */
export default function isDragDropSupported(): boolean {
  const div = document.body

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
