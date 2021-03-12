const cuid = require('cuid')
const { Provider, RequestClient, Socket } = require('@uppy/companion-client')
const emitSocketProgress = require('@uppy/utils/lib/emitSocketProgress')
const getSocketHost = require('@uppy/utils/lib/getSocketHost')
const EventTracker = require('@uppy/utils/lib/EventTracker')
const ProgressTimeout = require('@uppy/utils/lib/ProgressTimeout')
const NetworkError = require('@uppy/utils/lib/NetworkError')
const isNetworkError = require('@uppy/utils/lib/isNetworkError')

// See XHRUpload
function buildResponseError (xhr, error) {
  // No error message
  if (!error) error = new Error('Upload error')
  // Got an error message string
  if (typeof error === 'string') error = new Error(error)
  // Got something else
  if (!(error instanceof Error)) {
    error = Object.assign(new Error('Upload error'), { data: error })
  }

  if (isNetworkError(xhr)) {
    error = new NetworkError(error, xhr)
    return error
  }

  error.request = xhr
  return error
}

// See XHRUpload
function setTypeInBlob (file) {
  const dataWithUpdatedType = file.data.slice(0, file.data.size, file.meta.type)
  return dataWithUpdatedType
}

module.exports = class MiniXHRUpload {
  constructor (uppy, opts) {
    this.uppy = uppy
    this.opts = {
      validateStatus (status, responseText, response) {
        return status >= 200 && status < 300
      },
      ...opts
    }

    this.requests = opts.__queue
    this.uploaderEvents = Object.create(null)
    this.i18n = opts.i18n
  }

  _getOptions (file) {
    const uppy = this.uppy

    const overrides = uppy.getState().xhrUpload
    const opts = {
      ...this.opts,
      ...(overrides || {}),
      ...(file.xhrUpload || {}),
      headers: {}
    }
    Object.assign(opts.headers, this.opts.headers)
    if (overrides) {
      Object.assign(opts.headers, overrides.headers)
    }
    if (file.xhrUpload) {
      Object.assign(opts.headers, file.xhrUpload.headers)
    }

    return opts
  }

  uploadFile (id, current, total) {
    const file = this.uppy.getFile(id)
    if (file.error) {
      throw new Error(file.error)
    } else if (file.isRemote) {
      return this._uploadRemoteFile(file, current, total)
    }
    return this._uploadLocalFile(file, current, total)
  }

  _addMetadata (formData, meta, opts) {
    const metaFields = Array.isArray(opts.metaFields)
      ? opts.metaFields
      // Send along all fields by default.
      : Object.keys(meta)
    metaFields.forEach((item) => {
      formData.append(item, meta[item])
    })
  }

  _createFormDataUpload (file, opts) {
    const formPost = new FormData()

    this._addMetadata(formPost, file.meta, opts)

    const dataWithUpdatedType = setTypeInBlob(file)

    if (file.name) {
      formPost.append(opts.fieldName, dataWithUpdatedType, file.meta.name)
    } else {
      formPost.append(opts.fieldName, dataWithUpdatedType)
    }

    return formPost
  }

  _createBareUpload (file, opts) {
    return file.data
  }

  _onFileRemoved (fileID, cb) {
    this.uploaderEvents[fileID].on('file-removed', (file) => {
      if (fileID === file.id) cb(file.id)
    })
  }

  _onRetry (fileID, cb) {
    this.uploaderEvents[fileID].on('upload-retry', (targetFileID) => {
      if (fileID === targetFileID) {
        cb()
      }
    })
  }

  _onRetryAll (fileID, cb) {
    this.uploaderEvents[fileID].on('retry-all', (filesToRetry) => {
      if (!this.uppy.getFile(fileID)) return
      cb()
    })
  }

  _onCancelAll (fileID, cb) {
    this.uploaderEvents[fileID].on('cancel-all', () => {
      if (!this.uppy.getFile(fileID)) return
      cb()
    })
  }

  _uploadLocalFile (file, current, total) {
    const opts = this._getOptions(file)

    this.uppy.log(`uploading ${current} of ${total}`)
    return new Promise((resolve, reject) => {
      // This is done in index.js in the S3 plugin.
      // this.uppy.emit('upload-started', file)

      const data = opts.formData
        ? this._createFormDataUpload(file, opts)
        : this._createBareUpload(file, opts)

      const xhr = new XMLHttpRequest()
      this.uploaderEvents[file.id] = new EventTracker(this.uppy)

      const timer = new ProgressTimeout(opts.timeout, () => {
        xhr.abort()
        queuedRequest.done()
        const error = new Error(this.i18n('timedOut', { seconds: Math.ceil(opts.timeout / 1000) }))
        this.uppy.emit('upload-error', file, error)
        reject(error)
      })

      const id = cuid()

      xhr.upload.addEventListener('loadstart', (ev) => {
        this.uppy.log(`[AwsS3/XHRUpload] ${id} started`)
      })

      xhr.upload.addEventListener('progress', (ev) => {
        this.uppy.log(`[AwsS3/XHRUpload] ${id} progress: ${ev.loaded} / ${ev.total}`)
        // Begin checking for timeouts when progress starts, instead of loading,
        // to avoid timing out requests on browser concurrency queue
        timer.progress()

        if (ev.lengthComputable) {
          this.uppy.emit('upload-progress', file, {
            uploader: this,
            bytesUploaded: ev.loaded,
            bytesTotal: ev.total
          })
        }
      })

      xhr.addEventListener('load', (ev) => {
        this.uppy.log(`[AwsS3/XHRUpload] ${id} finished`)
        timer.done()
        queuedRequest.done()
        if (this.uploaderEvents[file.id]) {
          this.uploaderEvents[file.id].remove()
          this.uploaderEvents[file.id] = null
        }

        if (opts.validateStatus(ev.target.status, xhr.responseText, xhr)) {
          const body = opts.getResponseData(xhr.responseText, xhr)
          const uploadURL = body[opts.responseUrlFieldName]

          const uploadResp = {
            status: ev.target.status,
            body,
            uploadURL
          }

          this.uppy.emit('upload-success', file, uploadResp)

          if (uploadURL) {
            this.uppy.log(`Download ${file.name} from ${uploadURL}`)
          }

          return resolve(file)
        } else {
          const body = opts.getResponseData(xhr.responseText, xhr)
          const error = buildResponseError(xhr, opts.getResponseError(xhr.responseText, xhr))

          const response = {
            status: ev.target.status,
            body
          }

          this.uppy.emit('upload-error', file, error, response)
          return reject(error)
        }
      })

      xhr.addEventListener('error', (ev) => {
        this.uppy.log(`[AwsS3/XHRUpload] ${id} errored`)
        timer.done()
        queuedRequest.done()
        if (this.uploaderEvents[file.id]) {
          this.uploaderEvents[file.id].remove()
          this.uploaderEvents[file.id] = null
        }

        const error = buildResponseError(xhr, opts.getResponseError(xhr.responseText, xhr))
        this.uppy.emit('upload-error', file, error)
        return reject(error)
      })

      xhr.open(opts.method.toUpperCase(), opts.endpoint, true)
      // IE10 does not allow setting `withCredentials` and `responseType`
      // before `open()` is called.
      xhr.withCredentials = opts.withCredentials
      if (opts.responseType !== '') {
        xhr.responseType = opts.responseType
      }

      Object.keys(opts.headers).forEach((header) => {
        xhr.setRequestHeader(header, opts.headers[header])
      })

      const queuedRequest = this.requests.run(() => {
        xhr.send(data)
        return () => {
          timer.done()
          xhr.abort()
        }
      }, { priority: 1 })

      this._onFileRemoved(file.id, () => {
        queuedRequest.abort()
        reject(new Error('File removed'))
      })

      this._onCancelAll(file.id, () => {
        queuedRequest.abort()
        reject(new Error('Upload cancelled'))
      })
    })
  }

  _uploadRemoteFile (file, current, total) {
    const opts = this._getOptions(file)
    return new Promise((resolve, reject) => {
      // This is done in index.js in the S3 plugin.
      // this.uppy.emit('upload-started', file)

      const fields = {}
      const metaFields = Array.isArray(opts.metaFields)
        ? opts.metaFields
        // Send along all fields by default.
        : Object.keys(file.meta)

      metaFields.forEach((name) => {
        fields[name] = file.meta[name]
      })

      const Client = file.remote.providerOptions.provider ? Provider : RequestClient
      const client = new Client(this.uppy, file.remote.providerOptions)
      client.post(file.remote.url, {
        ...file.remote.body,
        endpoint: opts.endpoint,
        size: file.data.size,
        fieldname: opts.fieldName,
        metadata: fields,
        httpMethod: opts.method,
        useFormData: opts.formData,
        headers: opts.headers
      }).then((res) => {
        const token = res.token
        const host = getSocketHost(file.remote.companionUrl)
        const socket = new Socket({ target: `${host}/api/${token}`, autoOpen: false })
        this.uploaderEvents[file.id] = new EventTracker(this.uppy)

        this._onFileRemoved(file.id, () => {
          socket.send('pause', {})
          queuedRequest.abort()
          resolve(`upload ${file.id} was removed`)
        })

        this._onCancelAll(file.id, () => {
          socket.send('pause', {})
          queuedRequest.abort()
          resolve(`upload ${file.id} was canceled`)
        })

        this._onRetry(file.id, () => {
          socket.send('pause', {})
          socket.send('resume', {})
        })

        this._onRetryAll(file.id, () => {
          socket.send('pause', {})
          socket.send('resume', {})
        })

        socket.on('progress', (progressData) => emitSocketProgress(this, progressData, file))

        socket.on('success', (data) => {
          const body = opts.getResponseData(data.response.responseText, data.response)
          const uploadURL = body[opts.responseUrlFieldName]

          const uploadResp = {
            status: data.response.status,
            body,
            uploadURL
          }

          this.uppy.emit('upload-success', file, uploadResp)
          queuedRequest.done()
          if (this.uploaderEvents[file.id]) {
            this.uploaderEvents[file.id].remove()
            this.uploaderEvents[file.id] = null
          }
          return resolve()
        })

        socket.on('error', (errData) => {
          const resp = errData.response
          const error = resp
            ? opts.getResponseError(resp.responseText, resp)
            : Object.assign(new Error(errData.error.message), { cause: errData.error })
          this.uppy.emit('upload-error', file, error)
          queuedRequest.done()
          if (this.uploaderEvents[file.id]) {
            this.uploaderEvents[file.id].remove()
            this.uploaderEvents[file.id] = null
          }
          reject(error)
        })

        const queuedRequest = this.requests.run(() => {
          socket.open()
          if (file.isPaused) {
            socket.send('pause', {})
          }

          return () => socket.close()
        })
      }).catch((err) => {
        this.uppy.emit('upload-error', file, err)
        reject(err)
      })
    })
  }
}
