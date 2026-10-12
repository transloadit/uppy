/**
 * Return a Promise that resolves after `ms` milliseconds.
 */
export default function delay(
  ms: number,
  opts?: { signal: AbortSignal },
): Promise<void> {
  return new Promise((resolve, reject) => {
    const signal = opts?.signal
    signal?.throwIfAborted()

    const timeout = setTimeout(() => {
      cleanup()
      resolve()
    }, ms)

    function onabort(): void {
      clearTimeout(timeout)
      cleanup()
      reject(signal?.reason)
    }
    signal?.addEventListener('abort', onabort)
    function cleanup(): void {
      signal?.removeEventListener('abort', onabort)
    }
  })
}
