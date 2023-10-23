/* eslint-disable no-param-reassign */
/* eslint-disable max-len */

import NetworkError from './NetworkError.js'
import ProgressTimeout from './ProgressTimeout.js'

const noop = () => {}

/**
 * Get an abort signal that will be aborted when the specified Uppy file is removed or all uploads are cancelled.
 *
 * @param {Uppy} uppy
 *  The Uppy instance.
 * @param {string} [id]
 *  The ID of the file to watch for removal.
 * @param {AbortSignal} [additionalSignal]
 *  An optional additional abort signal.
 * @returns {AbortController}
 *  The abort signal.
 */
export function getUppyAbortController(uppy, id, additionalSignal) {
  const controller = new AbortController()

  uppy.once('cancel-all', () => {
    controller.abort()
  })

  if (id) {
    uppy.on('file-removed', (file) => {
      if (id === file.id) {
        controller.abort()
      }
    })
  }

  if (additionalSignal) {
    additionalSignal.addEventListener('abort', () => {
      controller.abort()
    })
  }

  return controller
}

/**
 * Fetches data from a specified URL using XMLHttpRequest, with optional retry functionality and progress tracking.
 *
 * @param {string} url
 *  The URL to send the request to.
 * @param {object} [options]
 *  Optional settings for the fetch operation.
 * @param {string} [options.method='GET']
 *  The HTTP method to use for the request.
 * @param {string} [options.body=null]
 *  The request payload, if any.
 * @param {string} [options.timeout=30000]
 *  Miliseconds between XMLHttpRequest upload progress events before the request is aborted.
 * @param {string} [options.withCredentials=false]
 *  Sets the withCredentials property of the XMLHttpRequest object.
 * @param {string} [options.responseType='']
 *  Sets the responseType property of the XMLHttpRequest object.
 * @param {Record<string, string>} [options.headers]
 *  An object representing any headers to send with the request.
 * @param {number} [options.retries=3]
 *  The number of retry attempts to make if the request fails.
 * @param {number} [options.delay=1000]
 *  The initial delay between retry attempts, in milliseconds. The delay doubles with each retry.
 * @param {function(Event): void} [options.onUploadProgress]
 *  A callback function for tracking upload progress.
 * @param {function(XMLHttpRequest): boolean} [options.shouldRetry]
 *  A function to determine whether to retry the request.
 * @param {function(): void} [options.onTimeout]
 *  Called when when no XMLHttpRequest upload progress events have been received for `timeout` ms.
 * @param {AbortSignal} [options.signal]
 *  signal to abort the upload.
 * @returns {Promise<XMLHttpRequest>}
 *  A Promise that resolves to the response text if the request succeeds, and rejects with an error if it fails.
 */
export function fetcher(url, options = {}) {
  const {
    body = null,
    headers = {},
    method = 'GET',
    onTimeout = noop,
    onUploadProgress = noop,
    responseType,
    retries = 3,
    shouldRetry = () => true,
    signal = null,
    timeout = 30 * 1000,
    withCredentials = false,
  } = options
  const delay = (attempt) => 0.3 * 2 ** (attempt - 1) * 1000
  const timer = new ProgressTimeout(timeout, onTimeout)

  function requestWithRetry(retryCount = 0) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.open(method || 'GET', url, true)
      xhr.withCredentials = withCredentials
      if (responseType !== '') {
        xhr.responseType = responseType
      }

      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort()
          // Using DOMException for abort errors aligns with
          // the convention established by the Fetch API.
          reject(new DOMException('Aborted', 'AbortError'))
        })
      }

      xhr.onload = () => {
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

      xhr.onerror = () => {
        if (shouldRetry(xhr) && retryCount < retries) {
          setTimeout(() => {
            requestWithRetry(retryCount + 1).then(resolve, reject)
          }, delay(retryCount))
        } else {
          timer.done()
          reject(new NetworkError(xhr.statusText, xhr))
        }
      }

      xhr.upload.onprogress = (event) => {
        timer.progress()
        onUploadProgress(event)
      }

      if (headers) {
        Object.keys(headers).forEach((key) => {
          xhr.setRequestHeader(key, headers[key])
        })
      }

      xhr.send(body)
    })
  }

  return requestWithRetry()
}
