const { createAbortError } = require('./AbortController')

/**
 * Return a Promise that resolves after `ms` milliseconds.
 *
 * @param {number} ms - Number of milliseconds to wait.
 * @param {{ signal?: AbortSignal }} [opts] - An abort signal that can be used to cancel the delay early.
 * @returns {Promise<void>} A Promise that resolves after the given amount of `ms`.
 */
module.exports = function delay (ms, opts) {
  return new Promise((resolve, reject) => {
    if (opts && opts.signal && opts.signal.aborted) {
      return reject(createAbortError())
    }

    function onabort () {
      clearTimeout(timeout)
      cleanup()
      reject(createAbortError())
    }

    const timeout = setTimeout(() => {
      cleanup()
      resolve()
    }, ms)

    if (opts && opts.signal) {
      opts.signal.addEventListener('abort', onabort)
    }
    function cleanup () {
      if (opts && opts.signal) {
        opts.signal.removeEventListener('abort', onabort)
      }
    }
  })
}
