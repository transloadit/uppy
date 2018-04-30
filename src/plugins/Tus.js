const Plugin = require('../core/Plugin')
const tus = require('tus-js-client')
const UppySocket = require('../core/UppySocket')
const {
  emitSocketProgress,
  getSocketHost,
  settle,
  limitPromises
} = require('../core/Utils')
require('whatwg-fetch')

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
 * Create a wrapper around an event emitter with a `remove` method to remove
 * all events that were added using the wrapped emitter.
 */
function createEventTracker (emitter) {
  const events = []
  return {
    on (event, fn) {
      events.push([ event, fn ])
      return emitter.on(event, fn)
    },
    remove () {
      events.forEach(([ event, fn ]) => {
        emitter.off(event, fn)
      })
    }
  }
}

/**
 * Tus resumable file uploader
 *
 */
module.exports = class Tus extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'uploader'
    this.id = 'Tus'
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
    if (typeof this.opts.limit === 'number' && this.opts.limit !== 0) {
      this.limitUploads = limitPromises(this.opts.limit)
    } else {
      this.limitUploads = (fn) => fn
    }

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
   * any events related to the file, and the uppy-server WebSocket connection.
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
   * @param {object} file for use with upload
   * @param {integer} current file in a queue
   * @param {integer} total number of files in a queue
   * @returns {Promise}
   */
  upload (file, current, total) {
    this.resetUploaderReferences(file.id)

    // Create a new tus upload
    return new Promise((resolve, reject) => {
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
        this.uppy.emit('upload-success', file, upload, upload.url)

        if (upload.url) {
          this.uppy.log('Download ' + upload.file.name + ' from ' + upload.url)
        }

        this.resetUploaderReferences(file.id)
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

      // tusd uses metadata fields 'filetype' and 'filename'
      const meta = Object.assign({}, file.meta)
      copyProp(meta, 'type', 'filetype')
      copyProp(meta, 'name', 'filename')
      optsTus.metadata = meta

      const upload = new tus.Upload(file.data, optsTus)
      this.uploaders[file.id] = upload
      this.uploaderEvents[file.id] = createEventTracker(this.uppy)

      this.onFileRemove(file.id, (targetFileID) => {
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
        this.resetUploaderReferences(file.id)
      })

      this.onResumeAll(file.id, () => {
        if (file.error) {
          upload.abort()
        }
        upload.start()
      })

      if (!file.isPaused) {
        upload.start()
      }
    })
  }

  uploadRemote (file, current, total) {
    this.resetUploaderReferences(file.id)

    const opts = Object.assign(
      {},
      this.opts,
      // Install file-specific upload overrides.
      file.tus || {}
    )

    return new Promise((resolve, reject) => {
      this.uppy.log(file.remote.url)
      if (file.serverToken) {
        return this.connectToServerSocket(file)
          .then(() => resolve())
          .catch(reject)
      }

      fetch(file.remote.url, {
        method: 'post',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.assign({}, file.remote.body, {
          endpoint: opts.endpoint,
          uploadUrl: opts.uploadUrl,
          protocol: 'tus',
          size: file.data.size,
          metadata: file.meta
        }))
      })
      .then((res) => {
        if (res.status < 200 || res.status > 300) {
          return reject(res.statusText)
        }

        return res.json().then((data) => {
          this.uppy.setFileState(file.id, { serverToken: data.token })
          file = this.uppy.getFile(file.id)
          return file
        })
      })
      .then((file) => {
        return this.connectToServerSocket(file)
      })
      .then(() => {
        resolve()
      })
      .catch((err) => {
        reject(new Error(err))
      })
    })
  }

  connectToServerSocket (file) {
    return new Promise((resolve, reject) => {
      const token = file.serverToken
      const host = getSocketHost(file.remote.host)
      const socket = new UppySocket({ target: `${host}/api/${token}` })
      this.uploaderSockets[file.id] = socket
      this.uploaderEvents[file.id] = createEventTracker(this.uppy)

      this.onFileRemove(file.id, () => {
        socket.send('pause', {})
        resolve(`upload ${file.id} was removed`)
      })

      this.onPause(file.id, (isPaused) => {
        isPaused ? socket.send('pause', {}) : socket.send('resume', {})
      })

      this.onPauseAll(file.id, () => socket.send('pause', {}))

      this.onCancelAll(file.id, () => socket.send('pause', {}))

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
        // close the socket—this will tell uppy-server to clear state and delete the file.
        if (!this.opts.useFastRemoteRetry) {
          this.resetUploaderReferences(file.id)
          // Remove the serverToken so that a new one will be created for the retry.
          this.uppy.setFileState(file.id, {
            serverToken: null
          })
        }

        this.uppy.emit('upload-error', file, error)
        reject(error)
      })

      socket.on('success', (data) => {
        this.uppy.emit('upload-success', file, data, data.url)
        this.resetUploaderReferences(file.id)
        resolve()
      })
    })
  }

  onReceiveUploadUrl (file, uploadURL) {
    const currentFile = this.uppy.getFile(file.id)
    if (!currentFile) return
    // Only do the update if we didn't have an upload URL yet,
    // or resume: false in options
    if ((!currentFile.tus || currentFile.tus.uploadUrl !== uploadURL) && this.opts.resume) {
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
    const actions = files.map((file, i) => {
      const current = parseInt(i, 10) + 1
      const total = files.length

      if (file.error) {
        return () => Promise.reject(new Error(file.error))
      } else if (file.isRemote) {
        // We emit upload-started here, so that it's also emitted for files
        // that have to wait due to the `limit` option.
        this.uppy.emit('upload-started', file)
        return this.uploadRemote.bind(this, file, current, total)
      } else {
        this.uppy.emit('upload-started', file)
        return this.upload.bind(this, file, current, total)
      }
    })

    const promises = actions.map((action) => {
      const limitedAction = this.limitUploads(action)
      return limitedAction()
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

  addResumableUploadsCapabilityFlag () {
    const newCapabilities = Object.assign({}, this.uppy.getState().capabilities)
    newCapabilities.resumableUploads = true
    this.uppy.setState({
      capabilities: newCapabilities
    })
  }

  install () {
    this.addResumableUploadsCapabilityFlag()
    this.uppy.addUploader(this.handleUpload)

    this.uppy.on('reset-progress', this.handleResetProgress)

    if (this.opts.autoRetry) {
      this.uppy.on('back-online', this.uppy.retryAll)
    }
  }

  uninstall () {
    this.uppy.removeUploader(this.handleUpload)

    if (this.opts.autoRetry) {
      this.uppy.off('back-online', this.uppy.retryAll)
    }
  }
}
