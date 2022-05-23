import { createAbortError } from './AbortController.js'

/**
 * Return a Promise that resolves after `ms` milliseconds.
 *
 * @param {number} ms - Number of milliseconds to wait.
 * @param {{ signal?: AbortSignal }} [opts] - An abort signal that can be used to cancel the delay early.
 * @returns {Promise<void>} A Promise that resolves after the given amount of `ms`.
 */
export default function delay (ms, opts) {
  return new Promise((resolve, reject) => {
    if (opts?.signal?.aborted) {
      return reject(createAbortError())
    }

    const timeout = setTimeout(() => {
      cleanup() // eslint-disable-line no-use-before-define
      resolve()
    }, ms)

    function onabort () {
      clearTimeout(timeout)
      cleanup() // eslint-disable-line no-use-before-define
      reject(createAbortError())
    }
    opts?.signal?.addEventListener('abort', onabort)
    function cleanup () {
      opts?.signal?.removeEventListener('abort', onabort)
    }
    return undefined
  })
}
