import NetworkError from './NetworkError.js'
import ProgressTimeout from './ProgressTimeout.js'

const noop = (): void => {}

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

      signal?.addEventListener('abort', () => {
        xhr.abort()
        // Using DOMException for abort errors aligns with
        // the convention established by the Fetch API.
        reject(new DOMException('Aborted', 'AbortError'))
      })

      xhr.onload = async () => {
        try {
          await onAfterResponse(xhr, retryCount)
        } catch (err) {
          // This is important as we need to emit the xhr
          // over the upload-error event.
          err.request = xhr
          onError(err)
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

      if (headers) {
        Object.keys(headers).forEach((key) => {
          xhr.setRequestHeader(key, headers[key])
        })
      }

      await onBeforeRequest(xhr, retryCount)
      xhr.send(body)
    })
  }

  return requestWithRetry()
}
