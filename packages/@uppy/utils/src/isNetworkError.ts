function isNetworkError(xhr?: XMLHttpRequest): boolean {
  if (!xhr) {
    return false
  }
  return (xhr.readyState !== 0 && xhr.readyState !== 4) || xhr.status === 0
}

export default isNetworkError
