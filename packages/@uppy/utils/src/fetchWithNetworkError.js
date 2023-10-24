import NetworkError from './NetworkError.js'

/**
 * Wrapper around window.fetch that throws a NetworkError when appropriate
 */
export default function fetchWithNetworkError (...options) {
  return fetch(...options)
    .catch((err) => {
      if (err.name === 'AbortError') { // todo maybe instead see npm package is-network-error
        throw err
      } else {
        throw new NetworkError(err)
      }
    })
}
