import type Uppy from '@uppy/core'
import type { RequestOptions } from '@uppy/utils/lib/CompanionClientProvider'
import ErrorWithCause from '@uppy/utils/lib/ErrorWithCause'
import fetchWithNetworkError from '@uppy/utils/lib/fetchWithNetworkError'
import getSocketHost from '@uppy/utils/lib/getSocketHost'
import type { Body, Meta, UppyFile } from '@uppy/utils/lib/UppyFile'
import UserFacingApiError from '@uppy/utils/lib/UserFacingApiError'
import pRetry, { AbortError } from 'p-retry'
import packageJson from '../package.json' with { type: 'json' }
import AuthError from './AuthError.js'

type CompanionHeaders = Record<string, string> | undefined

export type Opts = {
  name?: string
  provider: string
  pluginId: string
  companionUrl: string
  companionCookiesRule?: 'same-origin' | 'include' | 'omit'
  companionHeaders?: CompanionHeaders
  companionKeysParams?: Record<string, string>
}

// Remove the trailing slash so we can always safely append /xyz.
function stripSlash(url: string) {
  return url.replace(/\/$/, '')
}

const retryCount = 10 // set to a low number, like 2 to test manual user retries
const socketActivityTimeoutMs = 5 * 60 * 1000 // set to a low number like 10000 to test this

export const authErrorStatusCode = 401

class HttpError extends Error {
  statusCode: number

  constructor({
    statusCode,
    message,
  }: {
    statusCode: number
    message: string
  }) {
    super(message)
    this.name = 'HttpError'
    this.statusCode = statusCode
  }
}

async function handleJSONResponse<ResJson>(res: Response): Promise<ResJson> {
  if (res.status === authErrorStatusCode) {
    throw new AuthError()
  }

  if (res.ok) {
    return res.json()
  }

  let errMsg = `Failed request with status: ${res.status}. ${res.statusText}`
  let errData: any
  try {
    errData = await res.json()

    if (errData.message) errMsg = `${errMsg} message: ${errData.message}`
    if (errData.requestId) errMsg = `${errMsg} request-Id: ${errData.requestId}`
  } catch (cause) {
    // if the response contains invalid JSON, let's ignore the error data
    throw new Error(errMsg, { cause })
  }

  if (res.status >= 400 && res.status <= 499 && errData.message) {
    throw new UserFacingApiError(errData.message)
  }

  throw new HttpError({ statusCode: res.status, message: errMsg })
}

function emitSocketProgress(
  uploader: { uppy: Uppy<any, any> },
  progressData: {
    progress: string // pre-formatted percentage number as a string
    bytesTotal: number
    bytesUploaded: number
  },
  file: UppyFile<any, any>,
): void {
  const { progress, bytesUploaded, bytesTotal } = progressData
  if (progress) {
    uploader.uppy.log(`Upload progress: ${progress}`)
    uploader.uppy.emit('upload-progress', file, {
      uploadStarted: file.progress.uploadStarted ?? 0,
      bytesUploaded,
      bytesTotal,
    })
  }
}

export default class RequestClient<M extends Meta, B extends Body> {
  static VERSION = packageJson.version

  #companionHeaders: CompanionHeaders

  uppy: Uppy<M, B>

  opts: Opts

  constructor(uppy: Uppy<M, B>, opts: Opts) {
    this.uppy = uppy
    this.opts = opts
    this.onReceiveResponse = this.onReceiveResponse.bind(this)
    this.#companionHeaders = opts.companionHeaders
  }

  setCompanionHeaders(headers: Record<string, string>): void {
    this.#companionHeaders = headers
  }

  private [Symbol.for('uppy test: getCompanionHeaders')](): CompanionHeaders {
    return this.#companionHeaders
  }

  get hostname(): string {
    const { companion } = this.uppy.getState()
    const host = this.opts.companionUrl
    return stripSlash(companion?.[host] ? companion[host] : host)
  }

  async headers(emptyBody = false): Promise<Record<string, string>> {
    const defaultHeaders = {
      Accept: 'application/json',
      ...(emptyBody
        ? undefined
        : {
            // Passing those headers on requests with no data forces browsers to first make a preflight request.
            'Content-Type': 'application/json',
          }),
    }

    return {
      ...defaultHeaders,
      ...this.#companionHeaders,
    }
  }

  onReceiveResponse(res: Response): void {
    const { headers } = res
    const state = this.uppy.getState()
    const companion = state.companion || {}
    const host = this.opts.companionUrl

    // Store the self-identified domain name for the Companion instance we just hit.
    if (headers.has('i-am') && headers.get('i-am') !== companion[host]) {
      this.uppy.setState({
        companion: { ...companion, [host]: headers.get('i-am') as string },
      })
    }
  }

  #getUrl(url: string) {
    if (/^(https?:|)\/\//.test(url)) {
      return url
    }
    return `${this.hostname}/${url}`
  }

  protected async request<ResBody>({
    path,
    method = 'GET',
    data,
    skipPostResponse,
    signal,
  }: {
    path: string
    method?: string
    data?: Record<string, unknown>
    skipPostResponse?: boolean
    signal?: AbortSignal
  }): Promise<ResBody> {
    try {
      const headers = await this.headers(!data)
      const response = await fetchWithNetworkError(this.#getUrl(path), {
        method,
        signal,
        headers,
        credentials: this.opts.companionCookiesRule || 'same-origin',
        body: data ? JSON.stringify(data) : null,
      })
      if (!skipPostResponse) this.onReceiveResponse(response)

      return await handleJSONResponse<ResBody>(response)
    } catch (err) {
      // pass these through
      if (
        err.isAuthError ||
        err.name === 'UserFacingApiError' ||
        err.name === 'AbortError'
      )
        throw err

      throw new ErrorWithCause(`Could not ${method} ${this.#getUrl(path)}`, {
        cause: err,
      })
    }
  }

  async get<PostBody>(
    path: string,
    options?: RequestOptions,
  ): Promise<PostBody> {
    return this.request({ ...options, path })
  }

  async post<PostBody>(
    path: string,
    data: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<PostBody> {
    return this.request<PostBody>({ ...options, path, method: 'POST', data })
  }

  async delete<T>(
    path: string,
    data?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request({ ...options, path, method: 'DELETE', data })
  }

  /**
   * Remote uploading consists of two steps:
   * 1. #requestSocketToken which starts the download/upload in companion and returns a unique token for the upload.
   * Then companion will halt the upload until:
   * 2. #awaitRemoteFileUpload is called, which will open/ensure a websocket connection towards companion, with the
   * previously generated token provided. It returns a promise that will resolve/reject once the file has finished
   * uploading or is otherwise done (failed, canceled)
   */
  async uploadRemoteFile(
    file: UppyFile<M, B>,
    reqBody: Record<string, unknown>,
    options: { signal: AbortSignal; getQueue: () => any },
  ): Promise<void> {
    try {
      const { signal, getQueue } = options || {}

      return await pRetry(
        async () => {
          // if we already have a serverToken, assume that we are resuming the existing server upload id
          const existingServerToken = this.uppy.getFile(file.id)?.serverToken
          if (existingServerToken != null) {
            this.uppy.log(
              `Connecting to exiting websocket ${existingServerToken}`,
            )
            return this.#awaitRemoteFileUpload({
              file,
              queue: getQueue(),
              signal,
            })
          }

          const queueRequestSocketToken = getQueue().wrapPromiseFunction(
            async (
              ...args: [
                {
                  file: UppyFile<M, B>
                  postBody: Record<string, unknown>
                  signal: AbortSignal
                },
              ]
            ) => {
              try {
                return await this.#requestSocketToken(...args)
              } catch (outerErr) {
                // throwing AbortError will cause p-retry to stop retrying
                if (outerErr.isAuthError) throw new AbortError(outerErr)

                if (outerErr.cause == null) throw outerErr
                const err = outerErr.cause

                const isRetryableHttpError = () =>
                  [408, 409, 429, 418, 423].includes(err.statusCode) ||
                  (err.statusCode >= 500 &&
                    err.statusCode <= 599 &&
                    ![501, 505].includes(err.statusCode))
                if (err.name === 'HttpError' && !isRetryableHttpError())
                  throw new AbortError(err)

                // p-retry will retry most other errors,
                // but it will not retry TypeError (except network error TypeErrors)
                throw err
              }
            },
            { priority: -1 },
          )

          const serverToken = await queueRequestSocketToken({
            file,
            postBody: reqBody,
            signal,
          }).abortOn(signal)

          if (!this.uppy.getFile(file.id)) return undefined // has file since been removed?

          this.uppy.setFileState(file.id, { serverToken })

          return this.#awaitRemoteFileUpload({
            file: this.uppy.getFile(file.id), // re-fetching file because it might have changed in the meantime
            queue: getQueue(),
            signal,
          })
        },
        {
          retries: retryCount,
          signal,
          onFailedAttempt: (err) =>
            this.uppy.log(`Retrying upload due to: ${err.message}`, 'warning'),
        },
      )
    } catch (err) {
      // this is a bit confusing, but note that an error with the `name` prop set to 'AbortError' (from AbortController)
      // is not the same as `p-retry` `AbortError`
      if (err.name === 'AbortError') {
        // The file upload was aborted, it’s not an error
        return undefined
      }

      this.uppy.emit('upload-error', file, err)
      throw err
    }
  }

  #requestSocketToken = async ({
    file,
    postBody,
    signal,
  }: {
    file: UppyFile<M, B>
    postBody: Record<string, unknown>
    signal: AbortSignal
  }): Promise<string> => {
    if (file.remote?.url == null) {
      throw new Error('Cannot connect to an undefined URL')
    }

    const res = await this.post<{ token: string }>(
      file.remote.url,
      {
        ...file.remote.body,
        ...postBody,
      },
      { signal },
    )

    return res.token
  }

  /**
   * This method will ensure a websocket for the specified file and returns a promise that resolves
   * when the file has finished downloading, or rejects if it fails.
   * It will retry if the websocket gets disconnected
   */
  async #awaitRemoteFileUpload({
    file,
    queue,
    signal,
  }: {
    file: UppyFile<M, B>
    queue: any
    signal: AbortSignal
  }): Promise<void> {
    let removeEventHandlers: () => void

    const { capabilities } = this.uppy.getState()

    try {
      return await new Promise((resolve, reject) => {
        const token = file.serverToken
        const host = getSocketHost(file.remote!.companionUrl)

        let socket: WebSocket | undefined
        let socketAbortController: AbortController
        let activityTimeout: ReturnType<typeof setTimeout>

        let { isPaused } = file

        const socketSend = (action: string, payload?: unknown) => {
          if (socket == null || socket.readyState !== socket.OPEN) {
            this.uppy.log(
              `Cannot send "${action}" to socket ${
                file.id
              } because the socket state was ${String(socket?.readyState)}`,
              'warning',
            )
            return
          }

          socket.send(
            JSON.stringify({
              action,
              payload: payload ?? {},
            }),
          )
        }

        function sendState() {
          if (!capabilities.resumableUploads) return

          if (isPaused) socketSend('pause')
          else socketSend('resume')
        }

        const createWebsocket = async () => {
          if (socketAbortController) socketAbortController.abort()
          socketAbortController = new AbortController()

          const onFatalError = (err: Error) => {
            // Remove the serverToken so that a new one will be created for the retry.
            this.uppy.setFileState(file.id, { serverToken: null })
            socketAbortController?.abort?.()
            reject(err)
          }

          // todo instead implement the ability for users to cancel / retry *currently uploading files* in the UI
          function resetActivityTimeout() {
            clearTimeout(activityTimeout)
            if (isPaused) return
            activityTimeout = setTimeout(
              () =>
                onFatalError(
                  new Error(
                    'Timeout waiting for message from Companion socket',
                  ),
                ),
              socketActivityTimeoutMs,
            )
          }

          try {
            await queue
              .wrapPromiseFunction(async () => {
                const reconnectWebsocket = async () =>
                  new Promise((_, rejectSocket) => {
                    socket = new WebSocket(`${host}/api/${token}`)

                    resetActivityTimeout()

                    socket.addEventListener('close', () => {
                      socket = undefined
                      rejectSocket(new Error('Socket closed unexpectedly'))
                    })

                    socket.addEventListener('error', (error) => {
                      this.uppy.log(
                        `Companion socket error ${JSON.stringify(
                          error,
                        )}, closing socket`,
                        'warning',
                      )
                      socket?.close() // will 'close' event to be emitted
                    })

                    socket.addEventListener('open', () => {
                      sendState()
                    })

                    socket.addEventListener('message', (e) => {
                      resetActivityTimeout()

                      try {
                        const { action, payload } = JSON.parse(e.data)

                        switch (action) {
                          case 'progress': {
                            emitSocketProgress(
                              this,
                              payload,
                              this.uppy.getFile(file.id),
                            )
                            break
                          }
                          case 'success': {
                            // payload.response is sent from companion for xhr-upload (aka uploadMultipart in companion) and
                            // s3 multipart (aka uploadS3Multipart)
                            // but not for tus/transloadit (aka uploadTus)
                            // responseText is a string which may or may not be in JSON format
                            // this means that an upload destination of xhr or s3 multipart MUST respond with valid JSON
                            // to companion, or the JSON.parse will crash
                            const text = payload.response?.responseText

                            this.uppy.emit(
                              'upload-success',
                              this.uppy.getFile(file.id),
                              {
                                uploadURL: payload.url,
                                status: payload.response?.status ?? 200,
                                body: text
                                  ? (JSON.parse(text) as B)
                                  : undefined,
                              },
                            )
                            socketAbortController?.abort?.()
                            resolve()
                            break
                          }
                          case 'error': {
                            const { message } = payload.error
                            throw Object.assign(new Error(message), {
                              cause: payload.error,
                            })
                          }
                          default:
                            this.uppy.log(
                              `Companion socket unknown action ${action}`,
                              'warning',
                            )
                        }
                      } catch (err) {
                        onFatalError(err)
                      }
                    })

                    const closeSocket = () => {
                      this.uppy.log(`Closing socket ${file.id}`)
                      clearTimeout(activityTimeout)
                      if (socket) socket.close()
                      socket = undefined
                    }

                    socketAbortController.signal.addEventListener(
                      'abort',
                      () => {
                        closeSocket()
                      },
                    )
                  })

                await pRetry(reconnectWebsocket, {
                  retries: retryCount,
                  signal: socketAbortController.signal,
                  onFailedAttempt: () => {
                    if (socketAbortController.signal.aborted) return // don't log in this case
                    this.uppy.log(`Retrying websocket ${file.id}`)
                  },
                })
              })()
              .abortOn(socketAbortController.signal)
          } catch (err) {
            if (socketAbortController.signal.aborted) return
            onFatalError(err)
          }
        }

        const pause = (newPausedState: boolean) => {
          if (!capabilities.resumableUploads) return

          isPaused = newPausedState
          if (socket) sendState()
        }

        const onFileRemove = (targetFile: UppyFile<M, B>) => {
          if (!capabilities.individualCancellation) return
          if (targetFile.id !== file.id) return
          socketSend('cancel')
          socketAbortController?.abort?.()
          this.uppy.log(`upload ${file.id} was removed`)
          resolve()
        }

        const onCancelAll = () => {
          socketSend('cancel')
          socketAbortController?.abort?.()
          this.uppy.log(`upload ${file.id} was canceled`)
          resolve()
        }

        const onFilePausedChange = (
          targetFile: UppyFile<M, B> | undefined,
          newPausedState: boolean,
        ) => {
          if (targetFile?.id !== file.id) return
          pause(newPausedState)
        }

        const onPauseAll = () => pause(true)
        const onResumeAll = () => pause(false)

        this.uppy.on('file-removed', onFileRemove)
        this.uppy.on('cancel-all', onCancelAll)
        this.uppy.on('upload-pause', onFilePausedChange)
        this.uppy.on('pause-all', onPauseAll)
        this.uppy.on('resume-all', onResumeAll)

        removeEventHandlers = () => {
          this.uppy.off('file-removed', onFileRemove)
          this.uppy.off('cancel-all', onCancelAll)
          this.uppy.off('upload-pause', onFilePausedChange)
          this.uppy.off('pause-all', onPauseAll)
          this.uppy.off('resume-all', onResumeAll)
        }

        signal.addEventListener('abort', () => {
          socketAbortController?.abort()
        })

        createWebsocket()
      })
    } finally {
      // @ts-expect-error used before defined
      removeEventHandlers?.()
    }
  }
}
