const { Plugin } = require('@uppy/core')
const tus = require('tus-js-client')
const { Provider, RequestClient, Socket } = require('@uppy/companion-client')
const emitSocketProgress = require('@uppy/utils/lib/emitSocketProgress')
const getSocketHost = require('@uppy/utils/lib/getSocketHost')
const settle = require('@uppy/utils/lib/settle')
const EventTracker = require('@uppy/utils/lib/EventTracker')
const RateLimitedQueue = require('@uppy/utils/lib/RateLimitedQueue')

// Extracted from https://github.com/tus/tus-js-client/blob/master/lib/upload.js#L13
// excepted we removed 'fingerprint' key to avoid adding more dependencies
const tusDefaultOptions = {
  endpoint: '',
  resume: true,
  onProgress: null,
  onChunkComplete: null,
  onSuccess: null,
  onError: null,
  headers: {},
  chunkSize: Infinity,
  withCredentials: false,
  uploadUrl: null,
  uploadSize: null,
  overridePatchMethod: false,
  retryDelays: null
}

/**
 * Tus resumable file uploader
 *
 */
module.exports = class Tus extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'uploader'
    this.id = this.opts.id || 'Tus'
    this.title = 'Tus'

    // set default options
    const defaultOptions = {
      resume: true,
      autoRetry: true,
      useFastRemoteRetry: true,
      limit: 0,
      retryDelays: [0, 1000, 3000, 5000]
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    // Simultaneous upload limiting is shared across all uploads with this plugin.
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
   */
  resetUploaderReferences (fileID) {
    if (this.uploaders[fileID]) {
      this.uploaders[fileID].abort()
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
   * Create a new Tus upload
   *
   * @param {Object} file for use with upload
   * @param {integer} current file in a queue
   * @param {integer} total number of files in a queue
   * @returns {Promise}
   */
  upload (file, current, total) {
    this.resetUploaderReferences(file.id)

    // Create a new tus upload
    return new Promise((resolve, reject) => {
      this.uppy.emit('upload-started', file)

      const optsTus = Object.assign(
        {},
        tusDefaultOptions,
        this.opts,
        // Install file-specific upload overrides.
        file.tus || {}
      )

      optsTus.onError = (err) => {
        this.uppy.log(err)
        this.uppy.emit('upload-error', file, err)
        err.message = `Failed because: ${err.message}`

        this.resetUploaderReferences(file.id)
        queuedRequest.done()
        reject(err)
      }

      optsTus.onProgress = (bytesUploaded, bytesTotal) => {
        this.onReceiveUploadUrl(file, upload.url)
        this.uppy.emit('upload-progress', file, {
          uploader: this,
          bytesUploaded: bytesUploaded,
          bytesTotal: bytesTotal
        })
      }

      optsTus.onSuccess = () => {
        const uploadResp = {
          uploadURL: upload.url
        }

        this.uppy.emit('upload-success', file, uploadResp)

        if (upload.url) {
          this.uppy.log('Download ' + upload.file.name + ' from ' + upload.url)
        }

        this.resetUploaderReferences(file.id)
        queuedRequest.done()
        resolve(upload)
      }

      const copyProp = (obj, srcProp, destProp) => {
        if (
          Object.prototype.hasOwnProperty.call(obj, srcProp) &&
          !Object.prototype.hasOwnProperty.call(obj, destProp)
        ) {
          obj[destProp] = obj[srcProp]
        }
      }

      const meta = {}
      const metaFields = Array.isArray(optsTus.metaFields)
        ? optsTus.metaFields
        // Send along all fields by default.
        : Object.keys(file.meta)
      metaFields.forEach((item) => {
        meta[item] = file.meta[item]
      })

      // tusd uses metadata fields 'filetype' and 'filename'
      copyProp(meta, 'type', 'filetype')
      copyProp(meta, 'name', 'filename')

      optsTus.metadata = meta

      const upload = new tus.Upload(file.data, optsTus)
      this.uploaders[file.id] = upload
      this.uploaderEvents[file.id] = new EventTracker(this.uppy)

      const queuedRequest = this.requests.run(() => {
        if (!file.isPaused) {
          upload.start()
        }
        // Don't do anything here, the caller will take care of cancelling the upload itself
        // using resetUploaderReferences(). This is because resetUploaderReferences() has to be
        // called when this request is still in the queue, and has not been started yet, too. At
        // that point this cancellation function is not going to be called.
        return () => {}
      })

      this.onFileRemove(file.id, (targetFileID) => {
        queuedRequest.abort()
        this.resetUploaderReferences(file.id)
        resolve(`upload ${targetFileID} was removed`)
      })

      this.onPause(file.id, (isPaused) => {
        if (isPaused) {
          upload.abort()
        } else {
          upload.start()
        }
      })

      this.onPauseAll(file.id, () => {
        upload.abort()
      })

      this.onCancelAll(file.id, () => {
        queuedRequest.abort()
        this.resetUploaderReferences(file.id)
        resolve(`upload ${file.id} was canceled`)
      })

      this.onResumeAll(file.id, () => {
        if (file.error) {
          upload.abort()
        }
        upload.start()
      })
    }).catch((err) => {
      this.emit('upload-error', file, err)
      throw err
    })
  }

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
        metadata: file.meta
      }).then((res) => {
        this.uppy.setFileState(file.id, { serverToken: res.token })
        file = this.uppy.getFile(file.id)
        return this.connectToServerSocket(file)
      }).then(() => {
        resolve()
      }).catch((err) => {
        reject(new Error(err))
      })
    })
  }

  connectToServerSocket (file) {
    return new Promise((resolve, reject) => {
      const token = file.serverToken
      const host = getSocketHost(file.remote.companionUrl)
      const socket = new Socket({ target: `${host}/api/${token}`, autoOpen: false })
      this.uploaderSockets[file.id] = socket
      this.uploaderEvents[file.id] = new EventTracker(this.uppy)

      this.onFileRemove(file.id, () => {
        socket.send('pause', {})
        queuedRequest.abort()
        this.resetUploaderReferences(file.id)
        resolve(`upload ${file.id} was removed`)
      })

      this.onPause(file.id, (isPaused) => {
        isPaused ? socket.send('pause', {}) : socket.send('resume', {})
      })

      this.onPauseAll(file.id, () => socket.send('pause', {}))

      this.onCancelAll(file.id, () => {
        socket.send('pause', {})
        queuedRequest.abort()
        this.resetUploaderReferences(file.id)
        resolve(`upload ${file.id} was canceled`)
      })

      this.onResumeAll(file.id, () => {
        if (file.error) {
          socket.send('pause', {})
        }
        socket.send('resume', {})
      })

      this.onRetry(file.id, () => {
        socket.send('pause', {})
        socket.send('resume', {})
      })

      this.onRetryAll(file.id, () => {
        socket.send('pause', {})
        socket.send('resume', {})
      })

      if (file.isPaused) {
        socket.send('pause', {})
      }

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

      const queuedRequest = this.requests.run(() => {
        socket.open()
        return () => socket.close()
      })
    })
  }

  /**
   * Store the uploadUrl on the file options, so that when Golden Retriever
   * restores state, we will continue uploading to the correct URL.
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

  onFileRemove (fileID, cb) {
    this.uploaderEvents[fileID].on('file-removed', (file) => {
      if (fileID === file.id) cb(file.id)
    })
  }

  onPause (fileID, cb) {
    this.uploaderEvents[fileID].on('upload-pause', (targetFileID, isPaused) => {
      if (fileID === targetFileID) {
        // const isPaused = this.uppy.pauseResume(fileID)
        cb(isPaused)
      }
    })
  }

  onRetry (fileID, cb) {
    this.uploaderEvents[fileID].on('upload-retry', (targetFileID) => {
      if (fileID === targetFileID) {
        cb()
      }
    })
  }

  onRetryAll (fileID, cb) {
    this.uploaderEvents[fileID].on('retry-all', (filesToRetry) => {
      if (!this.uppy.getFile(fileID)) return
      cb()
    })
  }

  onPauseAll (fileID, cb) {
    this.uploaderEvents[fileID].on('pause-all', () => {
      if (!this.uppy.getFile(fileID)) return
      cb()
    })
  }

  onCancelAll (fileID, cb) {
    this.uploaderEvents[fileID].on('cancel-all', () => {
      if (!this.uppy.getFile(fileID)) return
      cb()
    })
  }

  onResumeAll (fileID, cb) {
    this.uploaderEvents[fileID].on('resume-all', () => {
      if (!this.uppy.getFile(fileID)) return
      cb()
    })
  }

  uploadFiles (files) {
    const promises = files.map((file, i) => {
      const current = parseInt(i, 10) + 1
      const total = files.length

      if (file.error) {
        return () => Promise.reject(new Error(file.error))
      } else if (file.isRemote) {
        return this.uploadRemote(file, current, total)
      } else {
        return this.upload(file, current, total)
      }
    })

    return settle(promises)
  }

  handleUpload (fileIDs) {
    if (fileIDs.length === 0) {
      this.uppy.log('Tus: no files to upload!')
      return Promise.resolve()
    }

    this.uppy.log('Tus is uploading...')
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
