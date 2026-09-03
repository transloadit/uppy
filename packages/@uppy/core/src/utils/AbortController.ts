/**
 * @deprecated
 *   Use the global [`AbortController`](https://developer.mozilla.org/docs/Web/API/AbortController).
 */
export const AbortController = globalThis.AbortController

/**
 * @deprecated
 *   Use the global [`AbortSignal`](https://developer.mozilla.org/docs/Web/API/AbortSignal).
 */
export const AbortSignal = globalThis.AbortSignal

/**
 * @deprecated
 *   Use [`AbortSignal.reason`](https://developer.mozilla.org/docs/Web/API/AbortSignal/reason) / [`AbortSignal.throwIfAborted()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/throwIfAborted).
 */
export const createAbortError = (
  message = 'Aborted',
  options?: Parameters<typeof Error>[1],
): DOMException => {
  const err = new DOMException(message, 'AbortError')
  if (options != null && Object.hasOwn(options, 'cause')) {
    Object.defineProperty(err, 'cause', {
      // @ts-expect-error TS is drunk
      __proto__: null,
      configurable: true,
      writable: true,
      value: options.cause,
    })
  }
  return err
}
