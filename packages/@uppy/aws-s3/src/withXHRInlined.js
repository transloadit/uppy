// If global `URL` constructor is available, use it
const URL_ = typeof URL === 'function' ? URL : require('url-parse')
const { Plugin } = require('@uppy/core')
const Translator = require('@uppy/utils/lib/Translator')
const RateLimitedQueue = require('@uppy/utils/lib/RateLimitedQueue')
const { RequestClient } = require('@uppy/companion-client')
const qsStringify = require('qs-stringify')
// For inlined chunks of XHRUpload:
const cuid = require('cuid')
const { Provider, Socket } = require('@uppy/companion-client')
const emitSocketProgress = require('@uppy/utils/lib/emitSocketProgress')
const getSocketHost = require('@uppy/utils/lib/getSocketHost')
const settle = require('@uppy/utils/lib/settle')
const EventTracker = require('@uppy/utils/lib/EventTracker')
const ProgressTimeout = require('@uppy/utils/lib/ProgressTimeout')

function resolveUrl (origin, link) {
  return new URL_(link, origin).toString()
}

function isXml (content, xhr) {
  const rawContentType = (xhr.headers ? xhr.headers['content-type'] : xhr.getResponseHeader('Content-Type'))

  if (rawContentType === null) {
    return false
  }

  // Get rid of mime parameters like charset=utf-8
  const contentType = rawContentType.replace(/;.*$/, '').toLowerCase()
  if (typeof contentType === 'string') {
    if (contentType === 'application/xml' || contentType === 'text/xml') {
      return true
    }
    // GCS uses text/html for some reason
    // https://github.com/transloadit/uppy/issues/896
    if (contentType === 'text/html' && /^<\?xml /.test(content)) {
      return true
    }
  }
  return false
}

function getXmlValue (source, key) {
  const start = source.indexOf(`<${key}>`)
  const end = source.indexOf(`</${key}>`, start)
  return start !== -1 && end !== -1
    ? source.slice(start + key.length + 2, end)
    : ''
}

function assertServerError (res) {
  if (res && res.error) {
    const error = new Error(res.message)
    Object.assign(error, res.error)
    throw error
  }
  return res
}

// warning deduplication flag: see `getResponseData()` XHRUpload option definition
let warnedSuccessActionStatus = false

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

  error.request = xhr
  return error
}

// See XHRUpload
function setTypeInBlob (file) {
  const dataWithUpdatedType = file.data.slice(0, file.data.size, file.meta.type)
  return dataWithUpdatedType
}

module.exports = class AwsS3 extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'uploader'
    this.id = this.opts.id || 'AwsS3'
    this.title = 'AWS S3'

    this.defaultLocale = {
      strings: {
        preparingUpload: 'Preparing upload...'
      }
    }

    const defaultOptions = {
      timeout: 30 * 1000,
      limit: 0,
      metaFields: [], // have to opt in
      getUploadParameters: this.getUploadParameters.bind(this)
    }

    this.opts = { ...defaultOptions, ...opts }

    this.i18nInit()

    this.client = new RequestClient(uppy, opts)
    this.handleUpload = this.handleUpload.bind(this)
    this.requests = new RateLimitedQueue(this.opts.limit)

    // Inlined from XHRUpload pending the pipeline rewrite:
    this.uploaderEvents = Object.create(null)
  }

  setOptions (newOpts) {
    super.setOptions(newOpts)
    this.i18nInit()
  }

  i18nInit () {
    this.translator = new Translator([this.defaultLocale, this.uppy.locale, this.opts.locale])
    this.i18n = this.translator.translate.bind(this.translator)
    this.setPluginState() // so that UI re-renders and we see the updated locale
  }

  getUploadParameters (file) {
    if (!this.opts.companionUrl) {
      throw new Error('Expected a `companionUrl` option containing a Companion address.')
    }

    const filename = encodeURIComponent(file.meta.name)
    const type = encodeURIComponent(file.meta.type)
    const metadata = {}
    this.opts.metaFields.forEach((key) => {
      if (file.meta[key] != null) {
        metadata[key] = file.meta[key].toString()
      }
    })

    const query = qsStringify({ filename, type, metadata })
    return this.client.get(`s3/params?${query}`)
      .then(assertServerError)
  }

  validateParameters (file, params) {
    const valid = typeof params === 'object' && params &&
      typeof params.url === 'string' &&
      (typeof params.fields === 'object' || params.fields == null) &&
      (params.method == null || /^(put|post)$/i.test(params.method))

    if (!valid) {
      const err = new TypeError(`AwsS3: got incorrect result from 'getUploadParameters()' for file '${file.name}', expected an object '{ url, method, fields, headers }'.\nSee https://uppy.io/docs/aws-s3/#getUploadParameters-file for more on the expected format.`)
      console.error(err)
      throw err
    }

    return params
  }

  handleUpload (fileIDs) {
    fileIDs.forEach((id) => {
      const file = this.uppy.getFile(id)
      this.uppy.emit('preprocess-progress', file, {
        mode: 'determinate',
        message: this.i18n('preparingUpload'),
        value: 0
      })
    })

    // Wrapping rate-limited opts.getUploadParameters in a Promise takes some boilerplate!
    const getUploadParameters = this.requests.wrapPromiseFunction((file) => {
      return this.opts.getUploadParameters(file)
    })

    const numberOfFiles = fileIDs.length

    return settle(fileIDs.map((id, index) => {
      const file = this.uppy.getFile(id)
      return getUploadParameters(file)
        .then((params) => {
          return this.validateParameters(file, params)
        })
        .then((params) => {
          this.uppy.emit('preprocess-progress', file, {
            mode: 'determinate',
            message: this.i18n('preparingUpload'),
            value: 1
          })

          const {
            method = 'post',
            url,
            fields,
            headers
          } = params
          const xhrOpts = {
            method,
            formData: method.toLowerCase() === 'post',
            endpoint: url,
            metaFields: fields ? Object.keys(fields) : []
          }

          if (headers) {
            xhrOpts.headers = headers
          }

          this.uppy.setFileState(file.id, {
            meta: { ...file.meta, ...fields },
            xhrUpload: xhrOpts
          })

          this.uppy.emit('preprocess-complete', this.uppy.getFile(file.id))

          return this._uploadInlinedFromXHRUpload(file.id, index, numberOfFiles)
        })
        .catch((error) => {
          this.uppy.emit('upload-error', file, error)
        })
    }))
  }

  _getXHRUploadOptions (file) {
    const uppy = this.uppy

    // Get the response data from a successful XMLHttpRequest instance.
    // `content` is the S3 response as a string.
    // `xhr` is the XMLHttpRequest instance.
    function defaultGetResponseData (content, xhr) {
      const opts = this

      // If no response, we've hopefully done a PUT request to the file
      // in the bucket on its full URL.
      if (!isXml(content, xhr)) {
        if (opts.method.toUpperCase() === 'POST') {
          if (!warnedSuccessActionStatus) {
            uppy.log('[AwsS3] No response data found, make sure to set the success_action_status AWS SDK option to 201. See https://uppy.io/docs/aws-s3/#POST-Uploads', 'warning')
            warnedSuccessActionStatus = true
          }
          // The responseURL won't contain the object key. Give up.
          return { location: null }
        }

        // responseURL is not available in older browsers.
        if (!xhr.responseURL) {
          return { location: null }
        }

        // Trim the query string because it's going to be a bunch of presign
        // parameters for a PUT request—doing a GET request with those will
        // always result in an error
        return { location: xhr.responseURL.replace(/\?.*$/, '') }
      }

      return {
        // Some S3 alternatives do not reply with an absolute URL.
        // Eg DigitalOcean Spaces uses /$bucketName/xyz
        location: resolveUrl(xhr.responseURL, getXmlValue(content, 'Location')),
        bucket: getXmlValue(content, 'Bucket'),
        key: getXmlValue(content, 'Key'),
        etag: getXmlValue(content, 'ETag')
      }
    }

    // Get the error data from a failed XMLHttpRequest instance.
    // `content` is the S3 response as a string.
    // `xhr` is the XMLHttpRequest instance.
    function defaultGetResponseError (content, xhr) {
      // If no response, we don't have a specific error message, use the default.
      if (!isXml(content, xhr)) {
        return
      }
      const error = getXmlValue(content, 'Message')
      return new Error(error)
    }

    const overrides = {
      fieldName: 'file',
      responseUrlFieldName: 'location',
      timeout: this.opts.timeout,
      // Share the rate limiting queue with XHRUpload.
      __queue: this.requests,
      responseType: 'text',
      getResponseData: this.opts.getResponseData || defaultGetResponseData,
      getResponseError: defaultGetResponseError,
      validateStatus (status, responseText, response) {
        return status >= 200 && status < 300
      }
    }
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

  _uploadInlinedFromXHRUpload (id, current, total) {
    const file = this.uppy.getFile(id)
    if (file.error) {
      throw new Error(file.error)
    } else if (file.isRemote) {
      return this._uploadRemoteInlinedFromXHRUpload(file, current, total)
    }
    return this._uploadLocalInlinedFromXHRUpload(file, current, total)
  }

  _addMetadataInlinedFromXHRUpload (formData, meta, opts) {
    const metaFields = Array.isArray(opts.metaFields)
      ? opts.metaFields
      // Send along all fields by default.
      : Object.keys(meta)
    metaFields.forEach((item) => {
      formData.append(item, meta[item])
    })
  }

  _createFormDataUploadInlinedFromXHRUpload (file, opts) {
    const formPost = new FormData()

    this._addMetadataInlinedFromXHRUpload(formPost, file.meta, opts)

    const dataWithUpdatedType = setTypeInBlob(file)

    if (file.name) {
      formPost.append(opts.fieldName, dataWithUpdatedType, file.meta.name)
    } else {
      formPost.append(opts.fieldName, dataWithUpdatedType)
    }

    return formPost
  }

  _createBareUploadInlinedFromXHRUpload (file, opts) {
    return file.data
  }

  _onFileRemoveInlinedFromXHRUpload (fileID, cb) {
    this.uploaderEvents[fileID].on('file-removed', (file) => {
      if (fileID === file.id) cb(file.id)
    })
  }

  _onRetryInlinedFromXHRUpload (fileID, cb) {
    this.uploaderEvents[fileID].on('upload-retry', (targetFileID) => {
      if (fileID === targetFileID) {
        cb()
      }
    })
  }

  _onRetryAllInlinedFromXHRUpload (fileID, cb) {
    this.uploaderEvents[fileID].on('retry-all', (filesToRetry) => {
      if (!this.uppy.getFile(fileID)) return
      cb()
    })
  }

  _onCancelAllInlinedFromXHRUpload (fileID, cb) {
    this.uploaderEvents[fileID].on('cancel-all', () => {
      if (!this.uppy.getFile(fileID)) return
      cb()
    })
  }

  _uploadLocalInlinedFromXHRUpload (file, current, total) {
    const opts = this._getXHRUploadOptions(file)

    this.uppy.log(`uploading ${current} of ${total}`)
    return new Promise((resolve, reject) => {
      this.uppy.emit('upload-started', file)

      const data = opts.formData
        ? this._createFormDataUploadInlinedFromXHRUpload(file, opts)
        : this._createBareUploadInlinedFromXHRUpload(file, opts)

      const timer = new ProgressTimeout(opts.timeout, () => {
        xhr.abort()
        queuedRequest.done()
        const error = new Error(this.i18n('timedOut', { seconds: Math.ceil(opts.timeout / 1000) }))
        this.uppy.emit('upload-error', file, error)
        reject(error)
      })

      const xhr = new XMLHttpRequest()
      this.uploaderEvents[file.id] = new EventTracker(this.uppy)

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
      })

      this._onFileRemoveInlinedFromXHRUpload(file.id, () => {
        queuedRequest.abort()
        reject(new Error('File removed'))
      })

      this._onCancelAllInlinedFromXHRUpload(file.id, () => {
        queuedRequest.abort()
        reject(new Error('Upload cancelled'))
      })
    })
  }

  _uploadRemoteInlinedFromXHRUpload (file, current, total) {
    const opts = this._getXHRUploadOptions(file)
    return new Promise((resolve, reject) => {
      this.uppy.emit('upload-started', file)

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
        headers: opts.headers
      }).then((res) => {
        const token = res.token
        const host = getSocketHost(file.remote.companionUrl)
        const socket = new Socket({ target: `${host}/api/${token}`, autoOpen: false })
        this.uploaderEvents[file.id] = new EventTracker(this.uppy)

        this._onFileRemoveInlinedFromXHRUpload(file.id, () => {
          socket.send('pause', {})
          queuedRequest.abort()
          resolve(`upload ${file.id} was removed`)
        })

        this._onCancelAllInlinedFromXHRUpload(file.id, () => {
          socket.send('pause', {})
          queuedRequest.abort()
          resolve(`upload ${file.id} was canceled`)
        })

        this._onRetryInlinedFromXHRUpload(file.id, () => {
          socket.send('pause', {})
          socket.send('resume', {})
        })

        this._onRetryAllInlinedFromXHRUpload(file.id, () => {
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
      })
    })
  }

  install () {
    this.uppy.addUploader(this.handleUpload)
  }

  uninstall () {
    this.uppy.removePreProcessor(this.handleUpload)
  }
}
