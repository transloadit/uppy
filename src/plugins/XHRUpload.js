const Plugin = require('../core/Plugin')
const cuid = require('cuid')
const Translator = require('../core/Translator')
const UppySocket = require('../core/UppySocket')
const {
  emitSocketProgress,
  getSocketHost,
  settle,
  limitPromises
} = require('../core/Utils')

function buildResponseError (xhr, error) {
  // No error message
  if (!error) error = new Error('Upload error')
  // Got an error message string
  if (typeof error === 'string') error = new Error(error)
  // Got something else
  if (!(error instanceof Error)) {
    error = Object.assign(new Error('Upload error'), { data: error })
  }

  error.request = xhr
  return error
}

module.exports = class XHRUpload extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'uploader'
    this.id = 'XHRUpload'
    this.title = 'XHRUpload'

    const defaultLocale = {
      strings: {
        timedOut: 'Upload stalled for %{seconds} seconds, aborting.'
      }
    }

    // Default options
    const defaultOptions = {
      formData: true,
      fieldName: 'files[]',
      method: 'post',
      metaFields: null,
      responseUrlFieldName: 'url',
      bundle: false,
      headers: {},
      locale: defaultLocale,
      timeout: 30 * 1000,
      limit: 0,
      /**
       * @typedef respObj
       * @property {string} responseText
       * @property {number} status
       * @property {string} statusText
       * @property {Object.<string, string>} headers
       *
       * @param {string} responseContent the response body
       * @param {XMLHttpRequest | respObj} responseObject the response object
       */
      getResponseData (responseContent, responseObject) {
        let response = {}
        try {
          response = JSON.parse(responseContent)
        } catch (err) {
          this.uppy.log(err, 'error')
        }

        return response
      },
      /**
       *
       * @param {string} responseContent the response body
       * @param {XMLHttpRequest | respObj} responseObject the response object
       */
      getResponseError (responseContent, responseObject) {
        return new Error('Upload error')
      }
    }

    // Merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
    this.locale = Object.assign({}, defaultLocale, this.opts.locale)
    this.locale.strings = Object.assign({}, defaultLocale.strings, this.opts.locale.strings)

    // i18n
    this.translator = new Translator({ locale: this.locale })
    this.i18n = this.translator.translate.bind(this.translator)

    this.handleUpload = this.handleUpload.bind(this)

    // Simultaneous upload limiting is shared across all uploads with this plugin.
    if (typeof this.opts.limit === 'number' && this.opts.limit !== 0) {
      this.limitUploads = limitPromises(this.opts.limit)
    } else {
      this.limitUploads = (fn) => fn
    }

    if (this.opts.bundle && !this.opts.formData) {
      throw new Error('`opts.formData` must be true when `opts.bundle` is enabled.')
    }
  }

  getOptions (file) {
    const opts = Object.assign({},
      this.opts,
      this.uppy.state.xhrUpload || {},
      file.xhrUpload || {}
    )
    opts.headers = {}
    Object.assign(opts.headers, this.opts.headers)
    if (this.uppy.state.xhrUpload) {
      Object.assign(opts.headers, this.uppy.state.xhrUpload.headers)
    }
    if (file.xhrUpload) {
      Object.assign(opts.headers, file.xhrUpload.headers)
    }

    return opts
  }

  // Helper to abort upload requests if there has not been any progress for `timeout` ms.
  // Create an instance using `timer = createProgressTimeout(10000, onTimeout)`
  // Call `timer.progress()` to signal that there has been progress of any kind.
  // Call `timer.done()` when the upload has completed.
  createProgressTimeout (timeout, timeoutHandler) {
    const uppy = this.uppy
    const self = this
    function onTimedOut () {
      uppy.log(`[XHRUpload] timed out`)
      const error = new Error(self.i18n('timedOut', { seconds: Math.ceil(timeout / 1000) }))
      timeoutHandler(error)
    }

    let aliveTimer = null
    function progress () {
      if (timeout > 0) {
        done()
        aliveTimer = setTimeout(onTimedOut, timeout)
      }
    }

    function done () {
      if (aliveTimer) {
        clearTimeout(aliveTimer)
        aliveTimer = null
      }
    }

    return {
      progress,
      done
    }
  }

  createFormDataUpload (file, opts) {
    const formPost = new FormData()

    const metaFields = Array.isArray(opts.metaFields)
      ? opts.metaFields
      // Send along all fields by default.
      : Object.keys(file.meta)
    metaFields.forEach((item) => {
      formPost.append(item, file.meta[item])
    })

    formPost.append(opts.fieldName, file.data)

    return formPost
  }

  createBareUpload (file, opts) {
    return file.data
  }

  upload (file, current, total) {
    const opts = this.getOptions(file)

    this.uppy.log(`uploading ${current} of ${total}`)
    return new Promise((resolve, reject) => {
      const data = opts.formData
        ? this.createFormDataUpload(file, opts)
        : this.createBareUpload(file, opts)

      const timer = this.createProgressTimeout(opts.timeout, (error) => {
        xhr.abort()
        this.uppy.emit('upload-error', file.id, error)
        reject(error)
      })

      const xhr = new XMLHttpRequest()
      const id = cuid()

      xhr.upload.addEventListener('loadstart', (ev) => {
        this.uppy.log(`[XHRUpload] ${id} started`)
        // Begin checking for timeouts when loading starts.
        timer.progress()
      })

      xhr.upload.addEventListener('progress', (ev) => {
        this.uppy.log(`[XHRUpload] ${id} progress: ${ev.loaded} / ${ev.total}`)
        timer.progress()

        if (ev.lengthComputable) {
          this.uppy.emit('upload-progress', {
            uploader: this,
            id: file.id,
            bytesUploaded: ev.loaded,
            bytesTotal: ev.total
          })
        }
      })

      xhr.addEventListener('load', (ev) => {
        this.uppy.log(`[XHRUpload] ${id} finished`)
        timer.done()

        if (ev.target.status >= 200 && ev.target.status < 300) {
          const resp = opts.getResponseData(xhr.responseText, xhr)
          const uploadURL = resp[opts.responseUrlFieldName]

          this.uppy.emit('upload-success', file.id, resp, uploadURL)

          if (uploadURL) {
            this.uppy.log(`Download ${file.name} from ${file.uploadURL}`)
          }

          return resolve(file)
        } else {
          const error = buildResponseError(xhr, opts.getResponseError(xhr.responseText, xhr))
          this.uppy.emit('upload-error', file.id, error)
          return reject(error)
        }
      })

      xhr.addEventListener('error', (ev) => {
        this.uppy.log(`[XHRUpload] ${id} errored`)
        timer.done()

        const error = buildResponseError(xhr, opts.getResponseError(xhr.responseText, xhr))
        this.uppy.emit('upload-error', file.id, error)
        return reject(error)
      })

      xhr.open(opts.method.toUpperCase(), opts.endpoint, true)

      Object.keys(opts.headers).forEach((header) => {
        xhr.setRequestHeader(header, opts.headers[header])
      })

      xhr.send(data)

      this.uppy.on('upload-cancel', (fileID) => {
        if (fileID === file.id) {
          xhr.abort()
        }
      })

      this.uppy.on('cancel-all', () => {
        // const files = this.uppy.getState().files
        // if (!files[file.id]) return
        xhr.abort()
      })
    })
  }

  uploadRemote (file, current, total) {
    const opts = this.getOptions(file)
    return new Promise((resolve, reject) => {
      const fields = {}
      const metaFields = Array.isArray(opts.metaFields)
        ? opts.metaFields
        // Send along all fields by default.
        : Object.keys(file.meta)

      metaFields.forEach((name) => {
        fields[name] = file.meta[name]
      })

      fetch(file.remote.url, {
        method: 'post',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.assign({}, file.remote.body, {
          endpoint: opts.endpoint,
          size: file.data.size,
          fieldname: opts.fieldName,
          metadata: fields,
          headers: opts.headers
        }))
      })
      .then((res) => {
        if (res.status < 200 && res.status > 300) {
          return reject(res.statusText)
        }

        res.json().then((data) => {
          const token = data.token
          const host = getSocketHost(file.remote.host)
          const socket = new UppySocket({ target: `${host}/api/${token}` })

          socket.on('progress', (progressData) => emitSocketProgress(this, progressData, file))

          socket.on('success', (data) => {
            const resp = opts.getResponseData(data.response.responseText, data.response)
            const uploadURL = resp[opts.responseUrlFieldName]
            this.uppy.emit('upload-success', file.id, resp, uploadURL)
            socket.close()
            return resolve()
          })

          socket.on('error', (errData) => {
            const resp = errData.response
            const error = resp ? opts.getResponseError(resp.responseText, resp) : new Error(errData.error)
            this.uppy.emit('upload-error', file.id, error)
            reject(new Error(errData.error))
          })
        })
      })
    })
  }

  uploadBundle (files) {
    return new Promise((resolve, reject) => {
      const endpoint = this.opts.endpoint
      const method = this.opts.method

      const formData = new FormData()
      files.forEach((file, i) => {
        const opts = this.getOptions(file)
        formData.append(opts.fieldName, file.data)
      })

      const xhr = new XMLHttpRequest()

      const timer = this.createProgressTimeout(this.opts.timeout, (error) => {
        xhr.abort()
        emitError(error)
        reject(error)
      })

      const emitError = (error) => {
        files.forEach((file) => {
          this.uppy.emit('upload-error', file.id, error)
        })
      }

      xhr.upload.addEventListener('loadstart', (ev) => {
        this.uppy.log('[XHRUpload] started uploading bundle')
        timer.progress()
      })

      xhr.upload.addEventListener('progress', (ev) => {
        timer.progress()

        if (!ev.lengthComputable) return

        files.forEach((file) => {
          this.uppy.emit('upload-progress', {
            uploader: this,
            id: file.id,
            bytesUploaded: ev.loaded,
            bytesTotal: ev.total
          })
        })
      })

      xhr.addEventListener('load', (ev) => {
        timer.done()

        if (ev.target.status >= 200 && ev.target.status < 300) {
          const resp = this.opts.getResponseData(xhr.responseText, xhr)
          files.forEach((file) => {
            this.uppy.emit('upload-success', file.id, resp)
          })
          return resolve()
        }

        const error = this.opts.getResponseError(xhr.responseText, xhr) || new Error('Upload error')
        error.request = xhr
        emitError(error)
        return reject(error)
      })

      xhr.addEventListener('error', (ev) => {
        timer.done()

        const error = this.opts.getResponseError(xhr.responseText, xhr) || new Error('Upload error')
        emitError(error)
        return reject(error)
      })

      this.uppy.on('cancel-all', () => {
        xhr.abort()
      })

      xhr.open(method.toUpperCase(), endpoint, true)

      Object.keys(this.opts.headers).forEach((header) => {
        xhr.setRequestHeader(header, this.opts.headers[header])
      })

      xhr.send(formData)

      files.forEach((file) => {
        this.uppy.emit('upload-started', file.id)
      })
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
        this.uppy.emit('upload-started', file.id)
        return this.uploadRemote.bind(this, file, current, total)
      } else {
        this.uppy.emit('upload-started', file.id)
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
      this.uppy.log('[XHRUpload] No files to upload!')
      return Promise.resolve()
    }

    this.uppy.log('[XHRUpload] Uploading...')
    const files = fileIDs.map((fileID) => this.uppy.getFile(fileID))

    if (this.opts.bundle) {
      return this.uploadBundle(files)
    }

    return this.uploadFiles(files).then(() => null)
  }

  install () {
    this.uppy.addUploader(this.handleUpload)
  }

  uninstall () {
    this.uppy.removeUploader(this.handleUpload)
  }
}
