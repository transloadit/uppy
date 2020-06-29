function isNetworkError (xhr) {
  if (!xhr) {
    return false
  }
  return (xhr.readyState !== 0 && xhr.readyState !== 4) || xhr.status === 0
}

module.exports = isNetworkError
