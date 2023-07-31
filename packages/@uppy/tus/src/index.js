import UploaderPlugin from '@uppy/core/lib/UploaderPlugin.js'
import * as tus from 'tus-js-client'
import { Provider, RequestClient, Socket } from '@uppy/companion-client'
import emitSocketProgress from '@uppy/utils/lib/emitSocketProgress'
import getSocketHost from '@uppy/utils/lib/getSocketHost'
import EventManager from '@uppy/utils/lib/EventManager'
import NetworkError from '@uppy/utils/lib/NetworkError'
import isNetworkError from '@uppy/utils/lib/isNetworkError'
import { RateLimitedQueue } from '@uppy/utils/lib/RateLimitedQueue'
import hasProperty from '@uppy/utils/lib/hasProperty'
import { filterNonFailedFiles, filterFilesToEmitUploadStarted } from '@uppy/utils/lib/fileFilters'
import getFingerprint from './getFingerprint.js'

import packageJson from '../package.json'

/** @typedef {import('..').TusOptions} TusOptions */
/** @typedef {import('tus-js-client').UploadOptions} RawTusOptions */
/** @typedef {import('@uppy/core').Uppy} Uppy */
/** @typedef {import('@uppy/core').UppyFile} UppyFile */
/** @typedef {import('@uppy/core').FailedUppyFile<{}>} FailedUppyFile */

/**
 * Extracted from https://github.com/tus/tus-js-client/blob/master/lib/upload.js#L13
 * excepted we removed 'fingerprint' key to avoid adding more dependencies
 *
 * @type {RawTusOptions}
 */
const tusDefaultOptions = {
  endpoint: '',

  uploadUrl: null,
  metadata: {},
  uploadSize: null,

  onProgress: null,
  onChunkComplete: null,
  onSuccess: null,
  onError: null,

  overridePatchMethod: false,
  headers: {},
  addRequestId: false,

  chunkSize: Infinity,
  retryDelays: [100, 1000, 3000, 5000],
  parallelUploads: 1,
  removeFingerprintOnSuccess: false,
  uploadLengthDeferred: false,
  uploadDataDuringCreation: false,
}

/**
 * Tus resumable file uploader
 */
export default class Tus extends UploaderPlugin {
  static VERSION = packageJson.version

  #retryDelayIterator

  /**
   * @param {Uppy} uppy
   * @param {TusOptions} opts
   */
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'uploader'
    this.id = this.opts.id || 'Tus'
    this.title = 'Tus'

    // set default options
    const defaultOptions = {
      useFastRemoteRetry: true,
      limit: 20,
      retryDelays: tusDefaultOptions.retryDelays,
      withCredentials: false,
    }

    // merge default options with the ones set by user
    /** @type {import("..").TusOptions} */
    this.opts = { ...defaultOptions, ...opts }

    if (opts?.allowedMetaFields === undefined && 'metaFields' in this.opts) {
      throw new Error('The `metaFields` option has been renamed to `allowedMetaFields`.')
    }

    if ('autoRetry' in opts) {
      throw new Error('The `autoRetry` option was deprecated and has been removed.')
    }

    /**
     * Simultaneous upload limiting is shared across all uploads with this plugin.
     *
     * @type {RateLimitedQueue}
     */
    this.requests = this.opts.rateLimitedQueue ?? new RateLimitedQueue(this.opts.limit)
    this.#retryDelayIterator = this.opts.retryDelays?.values()

    this.uploaders = Object.create(null)
    this.uploaderEvents = Object.create(null)
    this.uploaderSockets = Object.create(null)

    this.handleResetProgress = this.handleResetProgress.bind(this)
    this.setQueueRequestSocketToken(this.requests.wrapPromiseFunction(this.#requestSocketToken, { priority: -1 }))
  }

  handleResetProgress () {
    const files = { ...this.uppy.getState().files }
    Object.keys(files).forEach((fileID) => {
      // Only clone the file object if it has a Tus `uploadUrl` attached.
      if (files[fileID].tus && files[fileID].tus.uploadUrl) {
        const tusState = { ...files[fileID].tus }
        delete tusState.uploadUrl
        files[fileID] = { ...files[fileID], tus: tusState }
      }
    })

    this.uppy.setState({ files })
  }

  /**
   * Clean up all references for a file's upload: the tus.Upload instance,
   * any events related to the file, and the Companion WebSocket connection.
   *
   * @param {string} fileID
   */
  resetUploaderReferences (fileID, opts = {}) {
    if (this.uploaders[fileID]) {
      const uploader = this.uploaders[fileID]

      uploader.abort()

      if (opts.abort) {
        uploader.abort(true)
      }

      this.uploaders[fileID] = null
    }
    if (this.uploaderEvents[fileID]) {
      this.uploaderEvents[fileID].remove()
      this.uploaderEvents[fileID] = null
    }
    if (this.uploaderSockets[fileID]) {
      this.uploaderSockets[fileID].close()
      this.uploaderSockets[fileID] = null
    }
  }

  /**
   * Create a new Tus upload.
   *
   * A lot can happen during an upload, so this is quite hard to follow!
   * - First, the upload is started. If the file was already paused by the time the upload starts, nothing should happen.
   *   If the `limit` option is used, the upload must be queued onto the `this.requests` queue.
   *   When an upload starts, we store the tus.Upload instance, and an EventManager instance that manages the event listeners
   *   for pausing, cancellation, removal, etc.
   * - While the upload is in progress, it may be paused or cancelled.
   *   Pausing aborts the underlying tus.Upload, and removes the upload from the `this.requests` queue. All other state is
   *   maintained.
   *   Cancelling removes the upload from the `this.requests` queue, and completely aborts the upload-- the `tus.Upload`
   *   instance is aborted and discarded, the EventManager instance is destroyed (removing all listeners).
   *   Resuming the upload uses the `this.requests` queue as well, to prevent selectively pausing and resuming uploads from
   *   bypassing the limit.
   * - After completing an upload, the tus.Upload and EventManager instances are cleaned up, and the upload is marked as done
   *   in the `this.requests` queue.
   * - When an upload completed with an error, the same happens as on successful completion, but the `upload()` promise is
   *   rejected.
   *
   * When working on this function, keep in mind:
   *  - When an upload is completed or cancelled for any reason, the tus.Upload and EventManager instances need to be cleaned
   *    up using this.resetUploaderReferences().
   *  - When an upload is cancelled or paused, for any reason, it needs to be removed from the `this.requests` queue using
   *    `queuedRequest.abort()`.
   *  - When an upload is completed for any reason, including errors, it needs to be marked as such using
   *    `queuedRequest.done()`.
   *  - When an upload is started or resumed, it needs to go through the `this.requests` queue. The `queuedRequest` variable
   *    must be updated so the other uses of it are valid.
   *  - Before replacing the `queuedRequest` variable, the previous `queuedRequest` must be aborted, else it will keep taking
   *    up a spot in the queue.
   *
   * @param {UppyFile} file for use with upload
   * @returns {Promise<void>}
   */
  #upload (file) {
    this.resetUploaderReferences(file.id)

    // Create a new tus upload
    return new Promise((resolve, reject) => {
      let queuedRequest
      let qRequest
      let upload

      const opts = {
        ...this.opts,
        ...(file.tus || {}),
      }

      if (typeof opts.headers === 'function') {
        opts.headers = opts.headers(file)
      }

      /** @type {RawTusOptions} */
      const uploadOptions = {
        ...tusDefaultOptions,
        ...opts,
      }

      // We override tus fingerprint to uppy’s `file.id`, since the `file.id`
      // now also includes `relativePath` for files added from folders.
      // This means you can add 2 identical files, if one is in folder a,
      // the other in folder b.
      uploadOptions.fingerprint = getFingerprint(file)

      uploadOptions.onBeforeRequest = (req) => {
        const xhr = req.getUnderlyingObject()
        xhr.withCredentials = !!opts.withCredentials

        let userProvidedPromise
        if (typeof opts.onBeforeRequest === 'function') {
          userProvidedPromise = opts.onBeforeRequest(req, file)
        }

        if (hasProperty(queuedRequest, 'shouldBeRequeued')) {
          if (!queuedRequest.shouldBeRequeued) return Promise.reject()
          let done
          const p = new Promise((res) => { // eslint-disable-line promise/param-names
            done = res
          })
          queuedRequest = this.requests.run(() => {
            if (file.isPaused) {
              queuedRequest.abort()
            }
            done()
            return () => {}
          })
          // If the request has been requeued because it was rate limited by the
          // remote server, we want to wait for `RateLimitedQueue` to dispatch
          // the re-try request.
          // Therefore we create a promise that the queue will resolve when
          // enough time has elapsed to expect not to be rate-limited again.
          // This means we can hold the Tus retry here with a `Promise.all`,
          // together with the returned value of the user provided
          // `onBeforeRequest` option callback (in case it returns a promise).
          return Promise.all([p, userProvidedPromise])
        }
        return userProvidedPromise
      }

      uploadOptions.onError = (err) => {
        this.uppy.log(err)

        const xhr = err.originalRequest ? err.originalRequest.getUnderlyingObject() : null
        if (isNetworkError(xhr)) {
          // eslint-disable-next-line no-param-reassign
          err = new NetworkError(err, xhr)
        }

        this.resetUploaderReferences(file.id)
        queuedRequest?.abort()

        this.uppy.emit('upload-error', file, err)

        reject(err)
      }

      uploadOptions.onProgress = (bytesUploaded, bytesTotal) => {
        this.onReceiveUploadUrl(file, upload.url)
        this.uppy.emit('upload-progress', file, {
          uploader: this,
          bytesUploaded,
          bytesTotal,
        })
      }

      uploadOptions.onSuccess = () => {
        const uploadResp = {
          uploadURL: upload.url,
        }

        this.resetUploaderReferences(file.id)
        queuedRequest.done()

        this.uppy.emit('upload-success', file, uploadResp)

        if (upload.url) {
          this.uppy.log(`Download ${upload.file.name} from ${upload.url}`)
        }

        resolve(upload)
      }

      const defaultOnShouldRetry = (err) => {
        const status = err?.originalResponse?.getStatus()

        if (status === 429) {
          // HTTP 429 Too Many Requests => to avoid the whole download to fail, pause all requests.
          if (!this.requests.isPaused) {
            const next = this.#retryDelayIterator?.next()
            if (next == null || next.done) {
              return false
            }
            this.requests.rateLimit(next.value)
          }
        } else if (status > 400 && status < 500 && status !== 409 && status !== 423) {
          // HTTP 4xx, the server won't send anything, it's doesn't make sense to retry
          // HTTP 409 Conflict (happens if the Upload-Offset header does not match the one on the server)
          // HTTP 423 Locked (happens when a paused download is resumed too quickly)
          return false
        } else if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          // The navigator is offline, let's wait for it to come back online.
          if (!this.requests.isPaused) {
            this.requests.pause()
            window.addEventListener('online', () => {
              this.requests.resume()
            }, { once: true })
          }
        }
        queuedRequest.abort()
        queuedRequest = {
          shouldBeRequeued: true,
          abort () {
            this.shouldBeRequeued = false
          },
          done () {
            throw new Error('Cannot mark a queued request as done: this indicates a bug')
          },
          fn () {
            throw new Error('Cannot run a queued request: this indicates a bug')
          },
        }
        return true
      }

      if (opts.onShouldRetry != null) {
        uploadOptions.onShouldRetry = (...args) => opts.onShouldRetry(...args, defaultOnShouldRetry)
      } else {
        uploadOptions.onShouldRetry = defaultOnShouldRetry
      }

      const copyProp = (obj, srcProp, destProp) => {
        if (hasProperty(obj, srcProp) && !hasProperty(obj, destProp)) {
          // eslint-disable-next-line no-param-reassign
          obj[destProp] = obj[srcProp]
        }
      }

      /** @type {Record<string, string>} */
      const meta = {}
      const allowedMetaFields = Array.isArray(opts.allowedMetaFields)
        ? opts.allowedMetaFields
        // Send along all fields by default.
        : Object.keys(file.meta)
      allowedMetaFields.forEach((item) => {
        meta[item] = file.meta[item]
      })

      // tusd uses metadata fields 'filetype' and 'filename'
      copyProp(meta, 'type', 'filetype')
      copyProp(meta, 'name', 'filename')

      uploadOptions.metadata = meta

      upload = new tus.Upload(file.data, uploadOptions)
      this.uploaders[file.id] = upload
      this.uploaderEvents[file.id] = new EventManager(this.uppy)

      // eslint-disable-next-line prefer-const
      qRequest = () => {
        if (!file.isPaused) {
          upload.start()
        }
        // Don't do anything here, the caller will take care of cancelling the upload itself
        // using resetUploaderReferences(). This is because resetUploaderReferences() has to be
        // called when this request is still in the queue, and has not been started yet, too. At
        // that point this cancellation function is not going to be called.
        // Also, we need to remove the request from the queue _without_ destroying everything
        // related to this upload to handle pauses.
        return () => {}
      }

      upload.findPreviousUploads().then((previousUploads) => {
        const previousUpload = previousUploads[0]
        if (previousUpload) {
          this.uppy.log(`[Tus] Resuming upload of ${file.id} started at ${previousUpload.creationTime}`)
          upload.resumeFromPreviousUpload(previousUpload)
        }
      })

      queuedRequest = this.requests.run(qRequest)

      this.onFileRemove(file.id, (targetFileID) => {
        queuedRequest.abort()
        this.resetUploaderReferences(file.id, { abort: !!upload.url })
        resolve(`upload ${targetFileID} was removed`)
      })

      this.onPause(file.id, (isPaused) => {
        queuedRequest.abort()
        if (isPaused) {
          // Remove this file from the queue so another file can start in its place.
          upload.abort()
        } else {
          // Resuming an upload should be queued, else you could pause and then
          // resume a queued upload to make it skip the queue.
          queuedRequest = this.requests.run(qRequest)
        }
      })

      this.onPauseAll(file.id, () => {
        queuedRequest.abort()
        upload.abort()
      })

      this.onCancelAll(file.id, ({ reason } = {}) => {
        if (reason === 'user') {
          queuedRequest.abort()
          this.resetUploaderReferences(file.id, { abort: !!upload.url })
        }
        resolve(`upload ${file.id} was canceled`)
      })

      this.onResumeAll(file.id, () => {
        queuedRequest.abort()
        if (file.error) {
          upload.abort()
        }
        queuedRequest = this.requests.run(qRequest)
      })
    }).catch((err) => {
      this.uppy.emit('upload-error', file, err)
      throw err
    })
  }

  #requestSocketToken = async (file, options) => {
    const Client = file.remote.providerOptions.provider ? Provider : RequestClient
    const client = new Client(this.uppy, file.remote.providerOptions)
    const opts = { ...this.opts }

    if (file.tus) {
      // Install file-specific upload overrides.
      Object.assign(opts, file.tus)
    }

    const res = await client.post(file.remote.url, {
      ...file.remote.body,
      endpoint: opts.endpoint,
      uploadUrl: opts.uploadUrl,
      protocol: 'tus',
      size: file.data.size,
      headers: (typeof opts.headers === 'function') ? opts.headers(file) : opts.headers,
      metadata: file.meta,
    }, options)
    return res.token
  }

  /**
   * See the comment on the upload() method.
   *
   * Additionally, when an upload is removed, completed, or cancelled, we need to close the WebSocket connection. This is
   * handled by the resetUploaderReferences() function, so the same guidelines apply as in upload().
   *
   * @param {UppyFile} file
   */
  async connectToServerSocket (file) {
    return new Promise((resolve, reject) => {
      const token = file.serverToken
      const host = getSocketHost(file.remote.companionUrl)
      const socket = new Socket({ target: `${host}/api/${token}`, autoOpen: false })
      this.uploaderSockets[file.id] = socket
      this.uploaderEvents[file.id] = new EventManager(this.uppy)

      let queuedRequest

      this.onFileRemove(file.id, () => {
        socket.send('cancel', {})
        queuedRequest.abort()
        this.resetUploaderReferences(file.id)
        resolve(`upload ${file.id} was removed`)
      })

      this.onPause(file.id, (isPaused) => {
        if (isPaused) {
          // Remove this file from the queue so another file can start in its place.
          socket.send('pause', {})
          queuedRequest.abort()
        } else {
          // Resuming an upload should be queued, else you could pause and then
          // resume a queued upload to make it skip the queue.
          queuedRequest.abort()
          queuedRequest = this.requests.run(() => {
            socket.open()
            socket.send('resume', {})

            return () => {}
          })
        }
      })

      this.onPauseAll(file.id, () => {
        socket.send('pause', {})
        queuedRequest.abort()
      })

      this.onCancelAll(file.id, ({ reason } = {}) => {
        if (reason === 'user') {
          socket.send('cancel', {})
          queuedRequest.abort()
          this.resetUploaderReferences(file.id)
        }
        resolve(`upload ${file.id} was canceled`)
      })

      this.onResumeAll(file.id, () => {
        queuedRequest.abort()
        if (file.error) {
          socket.send('pause', {})
        }
        queuedRequest = this.requests.run(() => {
          socket.open()
          socket.send('resume', {})

          return () => {}
        })
      })

      this.onRetry(file.id, () => {
        // Only do the retry if the upload is actually in progress;
        // else we could try to send these messages when the upload is still queued.
        // We may need a better check for this since the socket may also be closed
        // for other reasons, like network failures.
        if (socket.isOpen) {
          socket.send('pause', {})
          socket.send('resume', {})
        }
      })

      this.onRetryAll(file.id, () => {
        // See the comment in the onRetry() call
        if (socket.isOpen) {
          socket.send('pause', {})
          socket.send('resume', {})
        }
      })

      socket.on('progress', (progressData) => emitSocketProgress(this, progressData, file))

      socket.on('error', (errData) => {
        const { message } = errData.error
        const error = Object.assign(new Error(message), { cause: errData.error })

        // If the remote retry optimisation should not be used,
        // close the socket—this will tell companion to clear state and delete the file.
        if (!this.opts.useFastRemoteRetry) {
          this.resetUploaderReferences(file.id)
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
        this.resetUploaderReferences(file.id)
        queuedRequest.done()
        socket.close()
        resolve()
      })

      queuedRequest = this.requests.run(() => {
        if (file.isPaused) {
          socket.send('pause', {})
        } else {
          socket.open()
        }

        // Just close the socket here, the caller will take care of cancelling the upload itself
        // using resetUploaderReferences(). This is because resetUploaderReferences() has to be
        // called when this request is still in the queue, and has not been started yet, too. At
        // that point this cancellation function is not going to be called.
        // Also, we need to remove the request from the queue _without_ destroying everything
        // related to this upload to handle pauses.
        return () => {}
      })
    })
  }

  /**
   * Store the uploadUrl on the file options, so that when Golden Retriever
   * restores state, we will continue uploading to the correct URL.
   *
   * @param {UppyFile} file
   * @param {string} uploadURL
   */
  onReceiveUploadUrl (file, uploadURL) {
    const currentFile = this.uppy.getFile(file.id)
    if (!currentFile) return
    // Only do the update if we didn't have an upload URL yet.
    if (!currentFile.tus || currentFile.tus.uploadUrl !== uploadURL) {
      this.uppy.log('[Tus] Storing upload url')
      this.uppy.setFileState(currentFile.id, {
        tus: { ...currentFile.tus, uploadUrl: uploadURL },
      })
    }
  }

  /**
   * @param {string} fileID
   * @param {function(string): void} cb
   */
  onFileRemove (fileID, cb) {
    this.uploaderEvents[fileID].on('file-removed', (file) => {
      if (fileID === file.id) cb(file.id)
    })
  }

  /**
   * @param {string} fileID
   * @param {function(boolean): void} cb
   */
  onPause (fileID, cb) {
    this.uploaderEvents[fileID].on('upload-pause', (targetFileID, isPaused) => {
      if (fileID === targetFileID) {
        // const isPaused = this.uppy.pauseResume(fileID)
        cb(isPaused)
      }
    })
  }

  /**
   * @param {string} fileID
   * @param {function(): void} cb
   */
  onRetry (fileID, cb) {
    this.uploaderEvents[fileID].on('upload-retry', (targetFileID) => {
      if (fileID === targetFileID) {
        cb()
      }
    })
  }

  /**
   * @param {string} fileID
   * @param {function(): void} cb
   */
  onRetryAll (fileID, cb) {
    this.uploaderEvents[fileID].on('retry-all', () => {
      if (!this.uppy.getFile(fileID)) return
      cb()
    })
  }

  /**
   * @param {string} fileID
   * @param {function(): void} cb
   */
  onPauseAll (fileID, cb) {
    this.uploaderEvents[fileID].on('pause-all', () => {
      if (!this.uppy.getFile(fileID)) return
      cb()
    })
  }

  /**
   * @param {string} fileID
   * @param {function(): void} eventHandler
   */
  onCancelAll (fileID, eventHandler) {
    this.uploaderEvents[fileID].on('cancel-all', (...args) => {
      if (!this.uppy.getFile(fileID)) return
      eventHandler(...args)
    })
  }

  /**
   * @param {string} fileID
   * @param {function(): void} cb
   */
  onResumeAll (fileID, cb) {
    this.uploaderEvents[fileID].on('resume-all', () => {
      if (!this.uppy.getFile(fileID)) return
      cb()
    })
  }

  /**
   * @param {(UppyFile | FailedUppyFile)[]} files
   */
  async #uploadFiles (files) {
    const filesFiltered = filterNonFailedFiles(files)
    const filesToEmit = filterFilesToEmitUploadStarted(filesFiltered)
    this.uppy.emit('upload-start', filesToEmit)

    await Promise.allSettled(filesFiltered.map((file, i) => {
      const current = i + 1
      const total = files.length

      if (file.isRemote) {
        const controller = new AbortController()

        const removedHandler = (removedFile) => {
          if (removedFile.id === file.id) controller.abort()
        }
        this.uppy.on('file-removed', removedHandler)

        this.resetUploaderReferences(file.id)
        const uploadPromise = this.uploadRemoteFile(file, { signal: controller.signal })

        this.requests.wrapSyncFunction(() => {
          this.uppy.off('file-removed', removedHandler)
        }, { priority: -1 })()

        return uploadPromise
      }
      return this.#upload(file, current, total)
    }))
  }

  /**
   * @param {string[]} fileIDs
   */
  #handleUpload = async (fileIDs) => {
    if (fileIDs.length === 0) {
      this.uppy.log('[Tus] No files to upload')
      return
    }

    if (this.opts.limit === 0) {
      this.uppy.log(
        '[Tus] When uploading multiple files at once, consider setting the `limit` option (to `10` for example), to limit the number of concurrent uploads, which helps prevent memory and network issues: https://uppy.io/docs/tus/#limit-0',
        'warning',
      )
    }

    this.uppy.log('[Tus] Uploading...')
    const filesToUpload = this.uppy.getFilesByIds(fileIDs)

    await this.#uploadFiles(filesToUpload)
  }

  install () {
    this.uppy.setState({
      capabilities: { ...this.uppy.getState().capabilities, resumableUploads: true },
    })
    this.uppy.addUploader(this.#handleUpload)

    this.uppy.on('reset-progress', this.handleResetProgress)
  }

  uninstall () {
    this.uppy.setState({
      capabilities: { ...this.uppy.getState().capabilities, resumableUploads: false },
    })
    this.uppy.removeUploader(this.#handleUpload)
  }
}
