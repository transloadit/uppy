/**
 * Little AbortController proxy module so we can swap out the implementation easily later.
 */
export const { AbortController } = globalThis
export const { AbortSignal } = globalThis
export const createAbortError = (message = 'Aborted') => new DOMException(message, 'AbortError')
