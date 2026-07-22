function isNetworkError(xhr?: XMLHttpRequest): boolean {
  if (!xhr) return false
  // finished but status is 0 — usually indicates a network/CORS/file error
  return xhr.readyState === 4 && xhr.status === 0
}

export default isNetworkError
