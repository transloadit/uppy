import hasOwnProperty from './hasProperty.js'
/**
 * Little AbortController proxy module so we can swap out the implementation easily later.
 */
export const { AbortController } = globalThis
export const { AbortSignal } = globalThis
export const createAbortError = (message = 'Aborted', options) => {
  const err = new DOMException(message, 'AbortError')
  if (options != null && hasOwnProperty(options, 'cause')) {
    Object.defineProperty(err, 'cause', { __proto__: null, configurable: true, writable: true, value: options.cause })
  }
  return err
}
