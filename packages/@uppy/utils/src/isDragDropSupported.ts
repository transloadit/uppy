/**
 * Checks if the browser supports Drag & Drop (not supported on mobile devices, for example).
 */
export default function isDragDropSupported(): boolean {
  const body = document.body

  // sometimes happens in the wild: https://github.com/transloadit/uppy/issues/5953
  if (body == null || typeof window === 'undefined' || window == null) {
    return false
  }

  if (
    !('draggable' in body) ||
    !('ondragstart' in body) ||
    !('ondrop' in body)
  ) {
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
