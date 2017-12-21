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
      bundle: true,
      headers: {},
      locale: defaultLocale,
      timeout: 30 * 1000,
      limit: 0,
      getResponseData (xhr) {
        return JSON.parse(xhr.response)
      },
      getResponseError (xhr) {
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

      const onTimedOut = () => {
        xhr.abort()
        this.uppy.log(`[XHRUpload] ${id} timed out`)
        const error = new Error(this.i18n('timedOut', { seconds: Math.ceil(opts.timeout / 1000) }))
        this.uppy.emit('upload-error', file.id, error)
        reject(error)
      }
      let aliveTimer
      const isAlive = () => {
        clearTimeout(aliveTimer)
        aliveTimer = setTimeout(onTimedOut, opts.timeout)
      }

      const xhr = new XMLHttpRequest()
      const id = cuid()

      xhr.upload.addEventListener('loadstart', (ev) => {
        this.uppy.log(`[XHRUpload] ${id} started`)
        if (opts.timeout > 0) {
          // Begin checking for timeouts when loading starts.
          isAlive()
        }
      })

      xhr.upload.addEventListener('progress', (ev) => {
        this.uppy.log(`[XHRUpload] ${id} progress: ${ev.loaded} / ${ev.total}`)
        if (opts.timeout > 0) {
          isAlive()
        }

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
        clearTimeout(aliveTimer)

        if (ev.target.status >= 200 && ev.target.status < 300) {
          const resp = opts.getResponseData(xhr)
          const uploadURL = resp[opts.responseUrlFieldName]

          this.uppy.emit('upload-success', file.id, resp, uploadURL)

          if (uploadURL) {
            this.uppy.log(`Download ${file.name} from ${file.uploadURL}`)
          }

          return resolve(file)
        } else {
          const error = opts.getResponseError(xhr) || new Error('Upload error')
          error.request = xhr
          this.uppy.emit('upload-error', file.id, error)
          return reject(error)
        }
      })

      xhr.addEventListener('error', (ev) => {
        this.uppy.log(`[XHRUpload] ${id} errored`)
        clearTimeout(aliveTimer)

        const error = opts.getResponseError(xhr) || new Error('Upload error')
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

      this.uppy.emit('upload-started', file.id)
    })
  }

  uploadRemote (file, current, total) {
    const opts = this.getOptions(file)
    return new Promise((resolve, reject) => {
      this.uppy.emit('upload-started', file.id)

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
          fields,
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
            this.uppy.emit('upload-success', file.id, data, data.url)
            socket.close()
            return resolve()
          })
        })
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
        return this.uploadRemote.bind(this, file, current, total)
      } else {
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
    const files = fileIDs.map(getFile, this)
    function getFile (fileID) {
      return this.uppy.state.files[fileID]
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
