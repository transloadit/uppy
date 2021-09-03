/**
 * Little AbortController proxy module so we can swap out the implementation easily later.
 */
exports.AbortController = typeof AbortController !== 'undefined' ? AbortController : undefined
exports.AbortSignal = typeof AbortSignal !== 'undefined' ? AbortSignal : undefined
exports.createAbortError = (message = 'Aborted') => new DOMException(message, 'AbortError')
