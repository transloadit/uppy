const Plugin = require('../../core/Plugin')
const RequestClient = require('../../server/RequestClient')
const UppySocket = require('../../core/UppySocket')
const emitSocketProgress = require('../../utils/emitSocketProgress')
const getSocketHost = require('../../utils/getSocketHost')
const limitPromises = require('../../utils/limitPromises')
const Uploader = require('./MultipartUploader')

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

function assertServerError (res) {
  if (res && res.error) {
    const error = new Error(res.message)
    Object.assign(error, res.error)
    throw error
  }
  return res
}

module.exports = class AwsS3Multipart extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'uploader'
    this.id = 'AwsS3Multipart'
    this.title = 'AWS S3 Multipart'
    this.server = new RequestClient(uppy, opts)

    const defaultOptions = {
      timeout: 30 * 1000,
      limit: 0,
      createMultipartUpload: this.createMultipartUpload.bind(this),
      listParts: this.listParts.bind(this),
      prepareUploadPart: this.prepareUploadPart.bind(this),
      abortMultipartUpload: this.abortMultipartUpload.bind(this),
      completeMultipartUpload: this.completeMultipartUpload.bind(this)
    }

    this.opts = Object.assign({}, defaultOptions, opts)

    this.upload = this.upload.bind(this)

    if (typeof this.opts.limit === 'number' && this.opts.limit !== 0) {
      this.limitRequests = limitPromises(this.opts.limit)
    } else {
      this.limitRequests = (fn) => fn
    }

    this.uploaders = Object.create(null)
    this.uploaderEvents = Object.create(null)
    this.uploaderSockets = Object.create(null)
  }

  /**
   * Clean up all references for a file's upload: the MultipartUploader instance,
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

  assertHost () {
    if (!this.opts.host) {
      throw new Error('Expected a `host` option containing an uppy-server address.')
    }
  }

  createMultipartUpload (file) {
    this.assertHost()

    return this.server.post('s3/multipart', {
      filename: file.name,
      type: file.type
    }).then(assertServerError)
  }

  listParts (file, { key, uploadId }) {
    this.assertHost()

    const filename = encodeURIComponent(key)
    return this.server.get(`s3/multipart/${uploadId}?key=${filename}`)
      .then(assertServerError)
  }

  prepareUploadPart (file, { key, uploadId, number }) {
    this.assertHost()

    const filename = encodeURIComponent(key)
    return this.server.get(`s3/multipart/${uploadId}/${number}?key=${filename}`)
      .then(assertServerError)
  }

  completeMultipartUpload (file, { key, uploadId, parts }) {
    this.assertHost()

    const filename = encodeURIComponent(key)
    const uploadIdEnc = encodeURIComponent(uploadId)
    return this.server.post(`s3/multipart/${uploadIdEnc}/complete?key=${filename}`, { parts })
      .then(assertServerError)
  }

  abortMultipartUpload (file, { key, uploadId }) {
    this.assertHost()

    const filename = encodeURIComponent(key)
    const uploadIdEnc = encodeURIComponent(uploadId)
    return this.server.delete(`s3/multipart/${uploadIdEnc}?key=${filename}`)
      .then(assertServerError)
  }

  uploadFile (file) {
    return new Promise((resolve, reject) => {
      const upload = new Uploader(file.data, Object.assign({
        // .bind to pass the file object to each handler.
        createMultipartUpload: this.limitRequests(this.opts.createMultipartUpload.bind(this, file)),
        listParts: this.limitRequests(this.opts.listParts.bind(this, file)),
        prepareUploadPart: this.opts.prepareUploadPart.bind(this, file),
        completeMultipartUpload: this.limitRequests(this.opts.completeMultipartUpload.bind(this, file)),
        abortMultipartUpload: this.limitRequests(this.opts.abortMultipartUpload.bind(this, file)),

        limit: this.opts.limit || 5,
        onStart: (data) => {
          const cFile = this.uppy.getFile(file.id)
          this.uppy.setFileState(file.id, {
            s3Multipart: Object.assign({}, cFile.s3Multipart, {
              key: data.key,
              uploadId: data.uploadId,
              parts: []
            })
          })
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          this.uppy.emit('upload-progress', file, {
            uploader: this,
            bytesUploaded: bytesUploaded,
            bytesTotal: bytesTotal
          })
        },
        onError: (err) => {
          this.uppy.log(err)
          this.uppy.emit('upload-error', file, err)
          err.message = `Failed because: ${err.message}`

          this.resetUploaderReferences(file.id)
          reject(err)
        },
        onSuccess: (result) => {
          this.uppy.emit('upload-success', file, upload, result.location)

          if (result.location) {
            this.uppy.log('Download ' + upload.file.name + ' from ' + result.location)
          }

          this.resetUploaderReferences(file.id)
          resolve(upload)
        },
        onPartComplete: (part) => {
          // Store completed parts in state.
          const cFile = this.uppy.getFile(file.id)
          this.uppy.setFileState(file.id, {
            s3Multipart: Object.assign({}, cFile.s3Multipart, {
              parts: [
                ...cFile.s3Multipart.parts,
                part
              ]
            })
          })

          this.uppy.emit('s3-multipart:part-uploaded', cFile, part)
        }
      }, file.s3Multipart))

      this.uploaders[file.id] = upload
      this.uploaderEvents[file.id] = createEventTracker(this.uppy)

      this.onFileRemove(file.id, (removed) => {
        this.resetUploaderReferences(file.id)
        resolve(`upload ${removed.id} was removed`)
      })

      this.onFilePause(file.id, (isPaused) => {
        if (isPaused) {
          upload.pause()
        } else {
          upload.start()
        }
      })

      this.onPauseAll(file.id, () => {
        upload.pause()
      })

      this.onCancelAll(file.id, () => {
        upload.abort({ really: true })
      })

      this.onResumeAll(file.id, () => {
        upload.start()
      })

      if (!file.isPaused) {
        upload.start()
      }

      if (!file.isRestored) {
        this.uppy.emit('upload-started', file, upload)
      }
    })
  }

  uploadRemote (file) {
    this.resetUploaderReferences(file.id)

    return new Promise((resolve, reject) => {
      if (file.serverToken) {
        return this.connectToServerSocket(file)
          .then(() => resolve())
          .catch(reject)
      }

      this.uppy.emit('upload-started', file)

      fetch(file.remote.url, {
        method: 'post',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.assign({}, file.remote.body, {
          protocol: 's3-multipart',
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
          return this.uppy.getFile(file.id)
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
      this.uploaderSockets[socket] = socket
      this.uploaderEvents[file.id] = createEventTracker(this.uppy)

      this.onFileRemove(file.id, (removed) => {
        socket.send('pause', {})
        resolve(`upload ${file.id} was removed`)
      })

      this.onFilePause(file.id, (isPaused) => {
        socket.send(isPaused ? 'pause' : 'resume', {})
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
        this.uppy.emit('upload-error', file, new Error(errData.error))
        reject(new Error(errData.error))
      })

      socket.on('success', (data) => {
        this.uppy.emit('upload-success', file, data, data.url)
        resolve()
      })
    })
  }

  upload (fileIDs) {
    if (fileIDs.length === 0) return Promise.resolve()

    const promises = fileIDs.map((id) => {
      const file = this.uppy.getFile(id)
      if (file.isRemote) {
        return this.uploadRemote(file)
      }
      return this.uploadFile(file)
    })

    return Promise.all(promises)
  }

  onFileRemove (fileID, cb) {
    this.uploaderEvents[fileID].on('file-removed', (file) => {
      if (fileID === file.id) cb(file.id)
    })
  }

  onFilePause (fileID, cb) {
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

  install () {
    this.uppy.setState({
      capabilities: Object.assign({}, this.uppy.getState().capabilities, {
        resumableUploads: true
      })
    })
    this.uppy.addUploader(this.upload)
  }

  uninstall () {
    this.uppy.setState({
      capabilities: Object.assign({}, this.uppy.getState().capabilities, {
        resumableUploads: false
      })
    })
    this.uppy.removeUploader(this.upload)
  }
}
