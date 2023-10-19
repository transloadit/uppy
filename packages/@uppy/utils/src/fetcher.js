/* eslint-disable max-len */

import NetworkError from './NetworkError.js'

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
 * @param {AbortSignal} [options.signal]
 *  signal to abort the upload.
 * @returns {Promise<XMLHttpRequest>}
 *  A Promise that resolves to the response text if the request succeeds, and rejects with an error if it fails.
 */
export function fetcher(url, options = {}) {
  const retries = options.retries || 3;
  const delay = (retryCount) => 0.3 * (2 ** (retryCount - 1)) * 1000
  const onUploadProgress = options.onUploadProgress || (() => {});
  const shouldRetry = options.shouldRetry || (() => true);

  function requestWithRetry(retryCount = 0) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(options.method || 'GET', url, true);

      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          xhr.abort()
          // Using DOMException for abort errors aligns with
          // the convention established by the Fetch API.
          reject(new DOMException('Aborted', 'AbortError'))
        })
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr)
        } else if (shouldRetry(xhr) && retryCount < retries) {
          setTimeout(() => {
            requestWithRetry(retryCount + 1).then(resolve, reject)
          }, delay(retryCount))
        } else {
          reject(new NetworkError(xhr.statusText, xhr));
        }
      };

      xhr.onerror = () => {
        if (shouldRetry(xhr) && retryCount < retries) {
          setTimeout(() => {
            requestWithRetry(retryCount + 1).then(resolve, reject)
          }, delay(retryCount))
        } else {
          reject(new NetworkError(xhr.statusText, xhr));
        }
      };

      xhr.upload.onprogress = (event) => {
        onUploadProgress(event);
      };

      if (options.headers) {
        Object.keys(options.headers).forEach(key => {
          xhr.setRequestHeader(key, options.headers[key]);
        });
      }

      xhr.send(options.body);
    });
  }

  return requestWithRetry();
}

