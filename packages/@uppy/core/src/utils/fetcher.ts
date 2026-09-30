import NetworkError from './NetworkError.js'
import ProgressTimeout from './ProgressTimeout.js'
import toError from './toError.js'

const noop = (): void => {}

/**
 * Folds header names that differ only in case into a single entry, last one
 * wins.
 *
 * Per the XHR spec, `setRequestHeader()` *combines* values when it is called
 * twice with names that are a byte-case-insensitive match, so passing both
 * `Content-Type` and `content-type` would send `Content-Type: a, b` rather
 * than the intended `b`. Callers merge header objects from several sources
 * (defaults, user options, a request signer), and plain objects have
 * case-sensitive keys, so such a clash is easy to produce by accident — and
 * for a signed request it turns into an opaque signature mismatch.
 */
function dedupeHeaders(
  headers: Record<string, string>,
): Iterable<[string, string]> {
  const byLowerCaseName = new Map<string, [string, string]>()
  for (const [name, value] of Object.entries(headers)) {
    byLowerCaseName.set(name.toLowerCase(), [name, value])
  }
  return byLowerCaseName.values()
}

export type FetcherOptions = {
  /** The HTTP method to use for the request. Default is 'GET'. */
  method?: string

  /** The request payload, if any. Default is null. */
  body?: Document | XMLHttpRequestBodyInit | null

  /** Milliseconds between XMLHttpRequest upload progress events before the request is aborted. Default is 30000 ms. */
  timeout?: number

  /** Sets the withCredentials property of the XMLHttpRequest object. Default is false. */
  withCredentials?: boolean

  /** Sets the responseType property of the XMLHttpRequest object. Default is an empty string. */
  responseType?: XMLHttpRequestResponseType

  /** An object representing any headers to send with the request. */
  headers?: Record<string, string>

  /** The number of retry attempts to make if the request fails. Default is 3. */
  retries?: number

  /** Called before the request is made. */
  onBeforeRequest?: (
    xhr: XMLHttpRequest,
    retryCount: number,
  ) => void | Promise<void>

  /** Function for tracking upload progress. */
  onUploadProgress?: (event: ProgressEvent) => void

  /** A function to determine whether to retry the request. */
  shouldRetry?: (xhr: XMLHttpRequest) => boolean

  /** Called after the response has succeeded or failed but before the promise is resolved. */
  onAfterResponse?: (
    xhr: XMLHttpRequest,
    retryCount: number,
  ) => void | Promise<void>

  /** Called when no XMLHttpRequest upload progress events have been received for `timeout` ms. */
  onTimeout?: (timeout: number) => void

  /** Signal to abort the upload. */
  signal?: AbortSignal
}

/**
 * Fetches data from a specified URL using XMLHttpRequest, with optional retry functionality and progress tracking.
 *
 * @param url The URL to send the request to.
 * @param options Optional settings for the fetch operation.
 */
export function fetcher(
  url: string,
  options: FetcherOptions = {},
): Promise<XMLHttpRequest> {
  const {
    body = null,
    headers = {},
    method = 'GET',
    onBeforeRequest = noop,
    onUploadProgress = noop,
    shouldRetry = () => true,
    onAfterResponse = noop,
    onTimeout = noop,
    responseType,
    retries = 3,
    signal = null,
    timeout = 30_000,
    withCredentials = false,
  } = options

  // 300 ms, 600 ms, 1200 ms, 2400 ms, 4800 ms
  const delay = (attempt: number): number => 0.3 * 2 ** (attempt - 1) * 1000
  const timer = new ProgressTimeout(timeout, onTimeout)

  function requestWithRetry(retryCount = 0): Promise<XMLHttpRequest> {
    // biome-ignore lint/suspicious/noAsyncPromiseExecutor: it's fine
    return new Promise(async (resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const onError = (error: Error) => {
        if (shouldRetry(xhr) && retryCount < retries) {
          setTimeout(() => {
            requestWithRetry(retryCount + 1).then(resolve, reject)
          }, delay(retryCount))
        } else {
          timer.done()
          reject(error)
        }
      }

      xhr.open(method, url, true)
      xhr.withCredentials = withCredentials
      if (responseType) {
        xhr.responseType = responseType
      }

      xhr.onload = async () => {
        try {
          await onAfterResponse(xhr, retryCount)
        } catch (err) {
          // This is important as we need to emit the xhr
          // over the upload-error event.
          onError(Object.assign(toError(err), { request: xhr }))
          return
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          timer.done()
          resolve(xhr)
        } else if (shouldRetry(xhr) && retryCount < retries) {
          setTimeout(() => {
            requestWithRetry(retryCount + 1).then(resolve, reject)
          }, delay(retryCount))
        } else {
          timer.done()
          reject(new NetworkError(xhr.statusText, xhr))
        }
      }

      xhr.onerror = () => onError(new NetworkError(xhr.statusText, xhr))

      xhr.upload.onprogress = (event: ProgressEvent) => {
        timer.progress()
        onUploadProgress(event)
      }

      for (const [name, value] of dedupeHeaders(headers)) {
        xhr.setRequestHeader(name, value)
      }

      function abort() {
        xhr.abort()
        // Using DOMException for abort errors aligns with
        // the convention established by the Fetch API.
        reject(new DOMException('Aborted', 'AbortError'))
      }

      signal?.addEventListener('abort', abort)

      if (signal?.aborted) {
        // in case the signal was already aborted
        abort()
        return
      }

      await onBeforeRequest(xhr, retryCount)
      xhr.send(body)
    })
  }

  return requestWithRetry()
}
