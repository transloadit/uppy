'use strict'

import fetchWithNetworkError from '@uppy/utils/lib/fetchWithNetworkError'
import ErrorWithCause from '@uppy/utils/lib/ErrorWithCause'
import emitSocketProgress from '@uppy/utils/lib/emitSocketProgress'
import getSocketHost from '@uppy/utils/lib/getSocketHost'
import EventManager from '@uppy/utils/lib/EventManager'

import AuthError from './AuthError.js'
import Socket from './Socket.js'

import packageJson from '../package.json'

// Remove the trailing slash so we can always safely append /xyz.
function stripSlash (url) {
  return url.replace(/\/$/, '')
}

async function handleJSONResponse (res) {
  if (res.status === 401) {
    throw new AuthError()
  }

  const jsonPromise = res.json()
  if (res.ok) {
    return jsonPromise
  }

  let errMsg = `Failed request with status: ${res.status}. ${res.statusText}`
  try {
    const errData = await jsonPromise
    errMsg = errData.message ? `${errMsg} message: ${errData.message}` : errMsg
    errMsg = errData.requestId
      ? `${errMsg} request-Id: ${errData.requestId}`
      : errMsg
  } catch {
    /* if the response contains invalid JSON, let's ignore the error */
  }
  throw new Error(errMsg)
}

// todo pull out into core instead?
const allowedHeadersCache = new Map()

export default class RequestClient {
  static VERSION = packageJson.version

  #companionHeaders

  constructor (uppy, opts, getQueue) {
    this.uppy = uppy
    this.opts = opts
    this.getQueue = getQueue
    this.onReceiveResponse = this.onReceiveResponse.bind(this)
    this.#companionHeaders = opts?.companionHeaders
  }

  setCompanionHeaders (headers) {
    this.#companionHeaders = headers
  }

  [Symbol.for('uppy test: getCompanionHeaders')] () {
    return this.#companionHeaders
  }

  get hostname () {
    const { companion } = this.uppy.getState()
    const host = this.opts.companionUrl
    return stripSlash(companion && companion[host] ? companion[host] : host)
  }

  async headers () {
    const defaultHeaders = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Uppy-Versions': `@uppy/companion-client=${RequestClient.VERSION}`,
    }

    return {
      ...defaultHeaders,
      ...this.#companionHeaders,
    }
  }

  onReceiveResponse ({ headers }) {
    const state = this.uppy.getState()
    const companion = state.companion || {}
    const host = this.opts.companionUrl

    // Store the self-identified domain name for the Companion instance we just hit.
    if (headers.has('i-am') && headers.get('i-am') !== companion[host]) {
      this.uppy.setState({
        companion: { ...companion, [host]: headers.get('i-am') },
      })
    }
  }

  #getUrl (url) {
    if (/^(https?:|)\/\//.test(url)) {
      return url
    }
    return `${this.hostname}/${url}`
  }

  /*
    Preflight was added to avoid breaking change between older Companion-client versions and
    newer Companion versions and vice-versa. Usually the break will manifest via CORS errors because a
    version of companion-client could be sending certain headers to a version of Companion server that
    does not support those headers. In which case, the default preflight would lead to CORS.
    So to avoid those errors, we do preflight ourselves, to see what headers the Companion server
    we are communicating with allows. And based on that, companion-client knows what headers to
    send and what headers to not send.

    The preflight only happens once throughout the life-cycle of a certain
    Companion-client <-> Companion-server pair (allowedHeadersCache).
    Subsequent requests use the cached result of the preflight.
    However if there is an error retrieving the allowed headers, we will try again next time
  */
  async preflight (path) {
    const allowedHeadersCached = allowedHeadersCache.get(this.hostname)
    if (allowedHeadersCached != null) return allowedHeadersCached

    const fallbackAllowedHeaders = [
      'accept',
      'content-type',
      'uppy-auth-token',
    ]

    const promise = (async () => {
      try {
        const response = await fetch(this.#getUrl(path), { method: 'OPTIONS' })

        const header = response.headers.get('access-control-allow-headers')
        if (header == null || header === '*') {
          allowedHeadersCache.set(this.hostname, fallbackAllowedHeaders)
          return fallbackAllowedHeaders
        }

        this.uppy.log(
          `[CompanionClient] adding allowed preflight headers to companion cache: ${this.hostname} ${header}`,
        )

        const allowedHeaders = header
          .split(',')
          .map((headerName) => headerName.trim().toLowerCase())
        allowedHeadersCache.set(this.hostname, allowedHeaders)
        return allowedHeaders
      } catch (err) {
        this.uppy.log(
          `[CompanionClient] unable to make preflight request ${err}`,
          'warning',
        )
        // If the user gets a network error or similar, we should try preflight
        // again next time, or else we might get incorrect behaviour.
        allowedHeadersCache.delete(this.hostname) // re-fetch next time
        return fallbackAllowedHeaders
      }
    })()

    allowedHeadersCache.set(this.hostname, promise)
    return promise
  }

  async preflightAndHeaders (path) {
    const [allowedHeaders, headers] = await Promise.all([
      this.preflight(path),
      this.headers(),
    ])
    // filter to keep only allowed Headers
    return Object.fromEntries(
      Object.entries(headers).filter(([header]) => {
        if (!allowedHeaders.includes(header.toLowerCase())) {
          this.uppy.log(
            `[CompanionClient] excluding disallowed header ${header}`,
          )
          return false
        }
        return true
      }),
    )
  }

  /** @protected */
  async request ({ path, method = 'GET', data, skipPostResponse, signal }) {
    try {
      const headers = await this.preflightAndHeaders(path)
      const response = await fetchWithNetworkError(this.#getUrl(path), {
        method,
        signal,
        headers,
        credentials: this.opts.companionCookiesRule || 'same-origin',
        body: data ? JSON.stringify(data) : null,
      })
      if (!skipPostResponse) this.onReceiveResponse(response)
      return handleJSONResponse(response)
    } catch (err) {
      if (err?.isAuthError) throw err
      throw new ErrorWithCause(`Could not ${method} ${this.#getUrl(path)}`, {
        cause: err,
      })
    }
  }

  async get (path, options = undefined) {
    // TODO: remove boolean support for options that was added for backward compatibility.
    // eslint-disable-next-line no-param-reassign
    if (typeof options === 'boolean') options = { skipPostResponse: options }
    return this.request({ ...options, path })
  }

  async post (path, data, options = undefined) {
    // TODO: remove boolean support for options that was added for backward compatibility.
    // eslint-disable-next-line no-param-reassign
    if (typeof options === 'boolean') options = { skipPostResponse: options }
    return this.request({ ...options, path, method: 'POST', data })
  }

  async delete (path, data = undefined, options) {
    // TODO: remove boolean support for options that was added for backward compatibility.
    // eslint-disable-next-line no-param-reassign
    if (typeof options === 'boolean') options = { skipPostResponse: options }
    return this.request({ ...options, path, method: 'DELETE', data })
  }

  async uploadRemoteFile (file, reqBody, options = {}) {
    try {
      if (file.serverToken) {
        return await this.connectToServerSocket(file, this.getQueue())
      }
      const queueRequestSocketToken = this.getQueue().wrapPromiseFunction(
        this.#requestSocketToken,
        { priority: -1 },
      )
      const serverToken = await queueRequestSocketToken(file, reqBody).abortOn(
        options.signal,
      )

      if (!this.uppy.getState().files[file.id]) return undefined

      this.uppy.setFileState(file.id, { serverToken })
      return await this.connectToServerSocket(
        this.uppy.getFile(file.id),
        this.getQueue(),
      )
    } catch (err) {
      if (err?.cause?.name === 'AbortError') {
        // The file upload was aborted, it’s not an error
        return undefined
      }

      this.uppy.setFileState(file.id, { serverToken: undefined })
      this.uppy.emit('upload-error', file, err)
      throw err
    }
  }

  #requestSocketToken = async (file, postBody) => {
    if (file.remote.url == null) {
      throw new Error('Cannot connect to an undefined URL')
    }

    const res = await this.post(file.remote.url, {
      ...file.remote.body,
      ...postBody,
    })

    return res.token
  }

  /**
   * @param {UppyFile} file
   */
  async connectToServerSocket (file, queue) {
    return new Promise((resolve, reject) => {
      const token = file.serverToken
      const host = getSocketHost(file.remote.companionUrl)
      const socket = new Socket({
        target: `${host}/api/${token}`,
        autoOpen: false,
      })
      const eventManager = new EventManager(this.uppy)

      let queuedRequest

      eventManager.onFileRemove(file.id, () => {
        socket.send('cancel', {})
        queuedRequest.abort()
        resolve(`upload ${file.id} was removed`)
      })

      eventManager.onPause(file.id, (isPaused) => {
        if (isPaused) {
          // Remove this file from the queue so another file can start in its place.
          socket.send('pause', {})
          queuedRequest.abort()
        } else {
          // Resuming an upload should be queued, else you could pause and then
          // resume a queued upload to make it skip the queue.
          queuedRequest.abort()
          queuedRequest = queue.run(() => {
            socket.open()
            socket.send('resume', {})

            return () => {}
          })
        }
      })

      eventManager.onPauseAll(file.id, () => {
        socket.send('pause', {})
        queuedRequest.abort()
      })

      eventManager.onCancelAll(file.id, ({ reason } = {}) => {
        if (reason === 'user') {
          socket.send('cancel', {})
          queuedRequest.abort()
        }
        resolve(`upload ${file.id} was canceled`)
      })

      eventManager.onResumeAll(file.id, () => {
        queuedRequest.abort()
        if (file.error) {
          socket.send('pause', {})
        }
        queuedRequest = queue.run(() => {
          socket.open()
          socket.send('resume', {})

          return () => {}
        })
      })

      eventManager.onRetry(file.id, () => {
        // Only do the retry if the upload is actually in progress;
        // else we could try to send these messages when the upload is still queued.
        // We may need a better check for this since the socket may also be closed
        // for other reasons, like network failures.
        if (socket.isOpen) {
          socket.send('pause', {})
          socket.send('resume', {})
        }
      })

      eventManager.onRetryAll(file.id, () => {
        // See the comment in the onRetry() call
        if (socket.isOpen) {
          socket.send('pause', {})
          socket.send('resume', {})
        }
      })

      socket.on('progress', (progressData) => emitSocketProgress(this, progressData, file))

      socket.on('error', (errData) => {
        const { message } = errData.error
        const error = Object.assign(new Error(message), {
          cause: errData.error,
        })

        // If the remote retry optimisation should not be used,
        // close the socket—this will tell companion to clear state and delete the file.
        if (!this.opts.useFastRemoteRetry) {
          // Remove the serverToken so that a new one will be created for the retry.
          this.uppy.setFileState(file.id, {
            serverToken: null,
          })
        } else {
          socket.close()
        }

        this.uppy.emit('upload-error', file, error)
        queuedRequest.done()
        reject(error)
      })

      socket.on('success', (data) => {
        const uploadResp = {
          uploadURL: data.url,
        }

        this.uppy.emit('upload-success', file, uploadResp)
        queuedRequest.done()
        socket.close()
        resolve()
      })

      queuedRequest = queue.run(() => {
        if (file.isPaused) {
          socket.send('pause', {})
        } else {
          socket.open()
        }

        return () => {}
      })
    })
  }
}
