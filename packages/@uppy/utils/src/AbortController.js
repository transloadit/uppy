/**
 * Little AbortController proxy module so we can swap out the implementation easily later.
 */

const { AbortController, AbortSignal } = require('abortcontroller-polyfill/dist/abortcontroller')

function createAbortError (message = 'Aborted') {
  try {
    return new DOMException(message, 'AbortError')
  } catch {
    // For Internet Explorer
    const error = new Error(message)
    error.name = 'AbortError'
    return error
  }
}

exports.AbortController = AbortController
exports.AbortSignal = AbortSignal
exports.createAbortError = createAbortError
