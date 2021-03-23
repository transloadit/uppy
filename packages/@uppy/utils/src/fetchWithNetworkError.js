const NetworkError = require('./NetworkError')

/**
 * Wrapper around window.fetch that throws a NetworkError when appropriate
 */
module.exports = function fetchWithNetworkError (...options) {
  return fetch(...options)
    .catch((err) => {
      if (err.name === 'AbortError') {
        throw err
      } else {
        throw new NetworkError(err)
      }
    })
}
