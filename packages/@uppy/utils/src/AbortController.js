/**
 * Little AbortController proxy module so we can swap out the implementation easily later.
 */
exports.AbortController = AbortController
exports.AbortSignal = AbortSignal
exports.createAbortError = (message = 'Aborted') => new DOMException(message, 'AbortError')
