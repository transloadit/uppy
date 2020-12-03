const { Plugin } = require('@uppy/core')
const tus = require('tus-js-client')
const { Provider, RequestClient, Socket } = require('@uppy/companion-client')
const emitSocketProgress = require('@uppy/utils/lib/emitSocketProgress')
const getSocketHost = require('@uppy/utils/lib/getSocketHost')
const settle = require('@uppy/utils/lib/settle')
const EventTracker = require('@uppy/utils/lib/EventTracker')
const NetworkError = require('@uppy/utils/lib/NetworkError')
const isNetworkError = require('@uppy/utils/lib/isNetworkError')
const RateLimitedQueue = require('@uppy/utils/lib/RateLimitedQueue')
const hasProperty = require('@uppy/utils/lib/hasProperty')
const getFingerprint = require('./getFingerprint')

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
  retryDelays: [0, 1000, 3000, 5000],
  parallelUploads: 1,
  storeFingerprintForResuming: true,
  removeFingerprintOnSuccess: false,
  uploadLengthDeferred: false,
  uploadDataDuringCreation: false
}

/**
 * Tus resumable file uploader
 */
module.exports = class Tus extends Plugin {
  static VERSION = require('../package.json').version

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
      autoRetry: true,
      resume: true,
      useFastRemoteRetry: true,
      limit: 0,
      retryDelays: [0, 1000, 3000, 5000],
      withCredentials: false
    }

    // merge default options with the ones set by user
    /** @type {import("..").TusOptions} */
    this.opts = Object.assign({}, defaultOptions, opts)

    /**
     * Simultaneous upload limiting is shared across all uploads with this plugin.
     *
     * @type {RateLimitedQueue}
     */
    this.requests = new RateLimitedQueue(this.opts.limit)

    this.uploaders = Object.create(null)
    this.uploaderEvents = Object.create(null)
    this.uploaderSockets = Object.create(null)

    this.handleResetProgress = this.handleResetProgress.bind(this)
    this.handleUpload = this.handleUpload.bind(this)
  }

  handleResetProgress () {
    const files = Object.assign({}, this.uppy.getState().files)
    Object.keys(files).forEach((fileID) => {
      // Only clone the file object if it has a Tus `uploadUrl` attached.
      if (files[fileID].tus && files[fileID].tus.uploadUrl) {
        const tusState = Object.assign({}, files[fileID].tus)
        delete tusState.uploadUrl
        files[fileID] = Object.assign({}, files[fileID], { tus: tusState })
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
        // to avoid 423 error from tus server, we wait
        // to be sure the previous request has been aborted before terminating the upload
        // @todo remove the timeout when this "wait" is handled in tus-js-client internally
        setTimeout(() => uploader.abort(true), 1000)
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
   *   When an upload starts, we store the tus.Upload instance, and an EventTracker instance that manages the event listeners
   *   for pausing, cancellation, removal, etc.
   * - While the upload is in progress, it may be paused or cancelled.
   *   Pausing aborts the underlying tus.Upload, and removes the upload from the `this.requests` queue. All other state is
   *   maintained.
   *   Cancelling removes the upload from the `this.requests` queue, and completely aborts the upload--the tus.Upload instance
   *   is aborted and discarded, the EventTracker instance is destroyed (removing all listeners).
   *   Resuming the upload uses the `this.requests` queue as well, to prevent selectively pausing and resuming uploads from
   *   bypassing the limit.
   * - After completing an upload, the tus.Upload and EventTracker instances are cleaned up, and the upload is marked as done
   *   in the `this.requests` queue.
   * - When an upload completed with an error, the same happens as on successful completion, but the `upload()` promise is rejected.
   *
   * When working on this function, keep in mind:
   *  - When an upload is completed or cancelled for any reason, the tus.Upload and EventTracker instances need to be cleaned up using this.resetUploaderReferences().
   *  - When an upload is cancelled or paused, for any reason, it needs to be removed from the `this.requests` queue using `queuedRequest.abort()`.
   *  - When an upload is completed for any reason, including errors, it needs to be marked as such using `queuedRequest.done()`.
   *  - When an upload is started or resumed, it needs to go through the `this.requests` queue. The `queuedRequest` variable must be updated so the other uses of it are valid.
   *  - Before replacing the `queuedRequest` variable, the previous `queuedRequest` must be aborted, else it will keep taking up a spot in the queue.
   *
   * @param {UppyFile} file for use with upload
   * @param {number} current file in a queue
   * @param {number} total number of files in a queue
   * @returns {Promise<void>}
   */
  upload (file, current, total) {
    this.resetUploaderReferences(file.id)

    // Create a new tus upload
    return new Promise((resolve, reject) => {
      this.uppy.emit('upload-started', file)

      const opts = {
        ...this.opts,
        ...(file.tus || {})
      }

      /** @type {RawTusOptions} */
      const uploadOptions = {
        ...tusDefaultOptions,
        // TODO only put tus-specific options in?
        ...opts
      }

      delete uploadOptions.resume

      // Make `resume: true` work like it did in tus-js-client v1.
      // TODO: Remove in @uppy/tus v2
      if (opts.resume) {
        uploadOptions.storeFingerprintForResuming = true
      }

      // We override tus fingerprint to uppy’s `file.id`, since the `file.id`
      // now also includes `relativePath` for files added from folders.
      // This means you can add 2 identical files, if one is in folder a,
      // the other in folder b.
      uploadOptions.fingerprint = getFingerprint(file)

      uploadOptions.onBeforeRequest = (req) => {
        const xhr = req.getUnderlyingObject()
        xhr.withCredentials = !!opts.withCredentials

        if (typeof opts.onBeforeRequest === 'function') {
          opts.onBeforeRequest(req)
        }
      }

      uploadOptions.onError = (err) => {
        this.uppy.log(err)

        const xhr = err.originalRequest ? err.originalRequest.getUnderlyingObject() : null
        if (isNetworkError(xhr)) {
          err = new NetworkError(err, xhr)
        }

        this.resetUploaderReferences(file.id)
        queuedRequest.done()

        this.uppy.emit('upload-error', file, err)

        reject(err)
      }

      uploadOptions.onProgress = (bytesUploaded, bytesTotal) => {
        this.onReceiveUploadUrl(file, upload.url)
        this.uppy.emit('upload-progress', file, {
          uploader: this,
          bytesUploaded: bytesUploaded,
          bytesTotal: bytesTotal
        })
      }

      uploadOptions.onSuccess = () => {
        const uploadResp = {
          uploadURL: upload.url
        }

        this.resetUploaderReferences(file.id)
        queuedRequest.done()

        this.uppy.emit('upload-success', file, uploadResp)

        if (upload.url) {
          this.uppy.log('Download ' + upload.file.name + ' from ' + upload.url)
        }

        resolve(upload)
      }

      const copyProp = (obj, srcProp, destProp) => {
        if (hasProperty(obj, srcProp) && !hasProperty(obj, destProp)) {
          obj[destProp] = obj[srcProp]
        }
      }

      /** @type {Record<string, string>} */
      const meta = {}
      const metaFields = Array.isArray(opts.metaFields)
        ? opts.metaFields
        // Send along all fields by default.
        : Object.keys(file.meta)
      metaFields.forEach((item) => {
        meta[item] = file.meta[item]
      })

      // tusd uses metadata fields 'filetype' and 'filename'
      copyProp(meta, 'type', 'filetype')
      copyProp(meta, 'name', 'filename')

      uploadOptions.metadata = meta

      const upload = new tus.Upload(file.data, uploadOptions)
      this.uploaders[file.id] = upload
      this.uploaderEvents[file.id] = new EventTracker(this.uppy)

      // Make `resume: true` work like it did in tus-js-client v1.
      // TODO: Remove in @uppy/tus v2.
      if (opts.resume) {
        upload.findPreviousUploads().then((previousUploads) => {
          const previousUpload = previousUploads[0]
          if (previousUpload) {
            this.uppy.log(`[Tus] Resuming upload of ${file.id} started at ${previousUpload.creationTime}`)
            upload.resumeFromPreviousUpload(previousUpload)
          }
        })
      }

      let queuedRequest = this.requests.run(() => {
        if (!file.isPaused) {
          // Ensure this gets scheduled to run _after_ `findPreviousUploads()` returns.
          // TODO: Remove in @uppy/tus v2.
          Promise.resolve().then(() => {
            upload.start()
          })
        }
        // Don't do anything here, the caller will take care of cancelling the upload itself
        // using resetUploaderReferences(). This is because resetUploaderReferences() has to be
        // called when this request is still in the queue, and has not been started yet, too. At
        // that point this cancellation function is not going to be called.
        // Also, we need to remove the request from the queue _without_ destroying everything
        // related to this upload to handle pauses.
        return () => {}
      })

      this.onFileRemove(file.id, (targetFileID) => {
        queuedRequest.abort()
        this.resetUploaderReferences(file.id, { abort: !!upload.url })
        resolve(`upload ${targetFileID} was removed`)
      })

      this.onPause(file.id, (isPaused) => {
        if (isPaused) {
          // Remove this file from the queue so another file can start in its place.
          queuedRequest.abort()
          upload.abort()
        } else {
          // Resuming an upload should be queued, else you could pause and then resume a queued upload to make it skip the queue.
          queuedRequest.abort()
          queuedRequest = this.requests.run(() => {
            upload.start()
            return () => {}
          })
        }
      })

      this.onPauseAll(file.id, () => {
        queuedRequest.abort()
        upload.abort()
      })

      this.onCancelAll(file.id, () => {
        queuedRequest.abort()
        this.resetUploaderReferences(file.id, { abort: !!upload.url })
        resolve(`upload ${file.id} was canceled`)
      })

      this.onResumeAll(file.id, () => {
        queuedRequest.abort()
        if (file.error) {
          upload.abort()
        }
        queuedRequest = this.requests.run(() => {
          upload.start()
          return () => {}
        })
      })
    }).catch((err) => {
      this.uppy.emit('upload-error', file, err)
      throw err
    })
  }

  /**
   * @param {UppyFile} file for use with upload
   * @param {number} current file in a queue
   * @param {number} total number of files in a queue
   * @returns {Promise<void>}
   */
  uploadRemote (file, current, total) {
    this.resetUploaderReferences(file.id)

    const opts = { ...this.opts }
    if (file.tus) {
      // Install file-specific upload overrides.
      Object.assign(opts, file.tus)
    }

    this.uppy.emit('upload-started', file)
    this.uppy.log(file.remote.url)

    if (file.serverToken) {
      return this.connectToServerSocket(file)
    }

    return new Promise((resolve, reject) => {
      const Client = file.remote.providerOptions.provider ? Provider : RequestClient
      const client = new Client(this.uppy, file.remote.providerOptions)

      // !! cancellation is NOT supported at this stage yet
      client.post(file.remote.url, {
        ...file.remote.body,
        endpoint: opts.endpoint,
        uploadUrl: opts.uploadUrl,
        protocol: 'tus',
        size: file.data.size,
        headers: opts.headers,
        metadata: file.meta
      }).then((res) => {
        this.uppy.setFileState(file.id, { serverToken: res.token })
        file = this.uppy.getFile(file.id)
        return this.connectToServerSocket(file)
      }).then(() => {
        resolve()
      }).catch((err) => {
        this.uppy.emit('upload-error', file, err)
        reject(err)
      })
    })
  }

  /**
   * See the comment on the upload() method.
   *
   * Additionally, when an upload is removed, completed, or cancelled, we need to close the WebSocket connection. This is handled by the resetUploaderReferences() function, so the same guidelines apply as in upload().
   *
   * @param {UppyFile} file
   */
  connectToServerSocket (file) {
    return new Promise((resolve, reject) => {
      const token = file.serverToken
      const host = getSocketHost(file.remote.companionUrl)
      const socket = new Socket({ target: `${host}/api/${token}`, autoOpen: false })
      this.uploaderSockets[file.id] = socket
      this.uploaderEvents[file.id] = new EventTracker(this.uppy)

      this.onFileRemove(file.id, () => {
        queuedRequest.abort()
        // still send pause event in case we are dealing with older version of companion
        // @todo don't send pause event in the next major release.
        socket.send('pause', {})
        socket.send('cancel', {})
        this.resetUploaderReferences(file.id)
        resolve(`upload ${file.id} was removed`)
      })

      this.onPause(file.id, (isPaused) => {
        if (isPaused) {
          // Remove this file from the queue so another file can start in its place.
          queuedRequest.abort()
          socket.send('pause', {})
        } else {
          // Resuming an upload should be queued, else you could pause and then resume a queued upload to make it skip the queue.
          queuedRequest.abort()
          queuedRequest = this.requests.run(() => {
            socket.send('resume', {})
            return () => {}
          })
        }
      })

      this.onPauseAll(file.id, () => {
        queuedRequest.abort()
        socket.send('pause', {})
      })

      this.onCancelAll(file.id, () => {
        queuedRequest.abort()
        // still send pause event in case we are dealing with older version of companion
        // @todo don't send pause event in the next major release.
        socket.send('pause', {})
        socket.send('cancel', {})
        this.resetUploaderReferences(file.id)
        resolve(`upload ${file.id} was canceled`)
      })

      this.onResumeAll(file.id, () => {
        queuedRequest.abort()
        if (file.error) {
          socket.send('pause', {})
        }
        queuedRequest = this.requests.run(() => {
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
            serverToken: null
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
          uploadURL: data.url
        }

        this.uppy.emit('upload-success', file, uploadResp)
        this.resetUploaderReferences(file.id)
        queuedRequest.done()

        resolve()
      })

      let queuedRequest = this.requests.run(() => {
        socket.open()
        if (file.isPaused) {
          socket.send('pause', {})
        }

        // Don't do anything here, the caller will take care of cancelling the upload itself
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
        tus: Object.assign({}, currentFile.tus, {
          uploadUrl: uploadURL
        })
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
    this.uploaderEvents[fileID].on('retry-all', (filesToRetry) => {
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
   * @param {function(): void} cb
   */
  onCancelAll (fileID, cb) {
    this.uploaderEvents[fileID].on('cancel-all', () => {
      if (!this.uppy.getFile(fileID)) return
      cb()
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
  uploadFiles (files) {
    const promises = files.map((file, i) => {
      const current = i + 1
      const total = files.length

      if ('error' in file && file.error) {
        return Promise.reject(new Error(file.error))
      } else if (file.isRemote) {
        return this.uploadRemote(file, current, total)
      } else {
        return this.upload(file, current, total)
      }
    })

    return settle(promises)
  }

  /**
   * @param {string[]} fileIDs
   */
  handleUpload (fileIDs) {
    if (fileIDs.length === 0) {
      this.uppy.log('[Tus] No files to upload')
      return Promise.resolve()
    }

    if (this.opts.limit === 0) {
      this.uppy.log(
        '[Tus] When uploading multiple files at once, consider setting the `limit` option (to `10` for example), to limit the number of concurrent uploads, which helps prevent memory and network issues: https://uppy.io/docs/tus/#limit-0',
        'warning'
      )
    }

    this.uppy.log('[Tus] Uploading...')
    const filesToUpload = fileIDs.map((fileID) => this.uppy.getFile(fileID))

    return this.uploadFiles(filesToUpload)
      .then(() => null)
  }

  install () {
    this.uppy.setState({
      capabilities: Object.assign({}, this.uppy.getState().capabilities, {
        resumableUploads: true
      })
    })
    this.uppy.addUploader(this.handleUpload)

    this.uppy.on('reset-progress', this.handleResetProgress)

    if (this.opts.autoRetry) {
      this.uppy.on('back-online', this.uppy.retryAll)
    }
  }

  uninstall () {
    this.uppy.setState({
      capabilities: Object.assign({}, this.uppy.getState().capabilities, {
        resumableUploads: false
      })
    })
    this.uppy.removeUploader(this.handleUpload)

    if (this.opts.autoRetry) {
      this.uppy.off('back-online', this.uppy.retryAll)
    }
  }
}
