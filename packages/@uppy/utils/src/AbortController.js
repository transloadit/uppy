/**
 * Little AbortController proxy module so we can swap out the implementation easily later.
 */
exports.AbortController = globalThis.AbortController
exports.AbortSignal = globalThis.AbortSignal
exports.createAbortError = (message = 'Aborted') => new DOMException(message, 'AbortError')
