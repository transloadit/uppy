import { createAbortError } from './AbortController.js'

/**
 * Return a Promise that resolves after `ms` milliseconds.
 */
export default function delay(
  ms: number,
  opts?: { signal: AbortSignal },
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (opts?.signal?.aborted) {
      return reject(createAbortError())
    }

    const timeout = setTimeout(() => {
      cleanup() // eslint-disable-line no-use-before-define
      resolve()
    }, ms)

    function onabort(): void {
      clearTimeout(timeout)
      cleanup() // eslint-disable-line no-use-before-define
      reject(createAbortError())
    }
    opts?.signal?.addEventListener('abort', onabort)
    function cleanup(): void {
      opts?.signal?.removeEventListener('abort', onabort)
    }
    return undefined
  })
}
