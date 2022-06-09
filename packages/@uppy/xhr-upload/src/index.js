import BasePlugin from '@uppy/core/lib/BasePlugin'
import { nanoid } from 'nanoid/non-secure'
import { Provider, RequestClient, Socket } from '@uppy/companion-client'
import emitSocketProgress from '@uppy/utils/lib/emitSocketProgress'
import getSocketHost from '@uppy/utils/lib/getSocketHost'
import settle from '@uppy/utils/lib/settle'
import EventTracker from '@uppy/utils/lib/EventTracker'
import ProgressTimeout from '@uppy/utils/lib/ProgressTimeout'
import { RateLimitedQueue, internalRateLimitedQueue } from '@uppy/utils/lib/RateLimitedQueue'
import NetworkError from '@uppy/utils/lib/NetworkError'
import isNetworkError from '@uppy/utils/lib/isNetworkError'

import packageJson from '../package.json'
import locale from './locale.js'

function buildResponseError (xhr, err) {
  let error = err
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

/**
 * Set `data.type` in the blob to `file.meta.type`,
 * because we might have detected a more accurate file type in Uppy
 * https://stackoverflow.com/a/50875615
 *
 * @param {object} file File object with `data`, `size` and `meta` properties
 * @returns {object} blob updated with the new `type` set from `file.meta.type`
 */
function setTypeInBlob (file) {
  const dataWithUpdatedType = file.data.slice(0, file.data.size, file.meta.type)
  return dataWithUpdatedType
}

export default class XHRUpload extends BasePlugin {
  // eslint-disable-next-line global-require
  static VERSION = packageJson.version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'uploader'
    this.id = this.opts.id || 'XHRUpload'
    this.title = 'XHRUpload'

    this.defaultLocale = locale

    // Default options
    const defaultOptions = {
      formData: true,
      fieldName: opts.bundle ? 'files[]' : 'file',
      method: 'post',
      metaFields: null,
      responseUrlFieldName: 'url',
      bundle: false,
      headers: {},
      timeout: 30 * 1000,
      limit: 5,
      withCredentials: false,
      responseType: '',
      /**
       * @param {string} responseText the response body string
       */
      getResponseData (responseText) {
        let parsedResponse = {}
        try {
          parsedResponse = JSON.parse(responseText)
        } catch (err) {
          uppy.log(err)
        }

        return parsedResponse
      },
      /**
       *
       * @param {string} _ the response body string
       * @param {XMLHttpRequest | respObj} response the response object (XHR or similar)
       */
      getResponseError (_, response) {
        let error = new Error('Upload error')

        if (isNetworkError(response)) {
          error = new NetworkError(error, response)
        }

        return error
      },
      /**
       * Check if the response from the upload endpoint indicates that the upload was successful.
       *
       * @param {number} status the response status code
       */
      validateStatus (status) {
        return status >= 200 && status < 300
      },
    }

    this.opts = { ...defaultOptions, ...opts }
    this.i18nInit()

    this.handleUpload = this.handleUpload.bind(this)

    // Simultaneous upload limiting is shared across all uploads with this plugin.
    if (internalRateLimitedQueue in this.opts) {
      this.requests = this.opts[internalRateLimitedQueue]
    } else {
      this.requests = new RateLimitedQueue(this.opts.limit)
    }

    if (this.opts.bundle && !this.opts.formData) {
      throw new Error('`opts.formData` must be true when `opts.bundle` is enabled.')
    }

    this.uploaderEvents = Object.create(null)
  }

  getOptions (file) {
    const overrides = this.uppy.getState().xhrUpload
    const { headers } = this.opts

    const opts = {
      ...this.opts,
      ...(overrides || {}),
      ...(file.xhrUpload || {}),
      headers: {},
    }
    // Support for `headers` as a function, only in the XHRUpload settings.
    // Options set by other plugins in Uppy state or on the files themselves are still merged in afterward.
    //
    // ```js
    // headers: (file) => ({ expires: file.meta.expires })
    // ```
    if (typeof headers === 'function') {
      opts.headers = headers(file)
    } else {
      Object.assign(opts.headers, this.opts.headers)
    }

    if (overrides) {
      Object.assign(opts.headers, overrides.headers)
    }
    if (file.xhrUpload) {
      Object.assign(opts.headers, file.xhrUpload.headers)
    }

    return opts
  }

  // eslint-disable-next-line class-methods-use-this
  addMetadata (formData, meta, opts) {
    const metaFields = Array.isArray(opts.metaFields)
      ? opts.metaFields
      : Object.keys(meta) // Send along all fields by default.

    metaFields.forEach((item) => {
      formData.append(item, meta[item])
    })
  }

  createFormDataUpload (file, opts) {
    const formPost = new FormData()

    this.addMetadata(formPost, file.meta, opts)

    const dataWithUpdatedType = setTypeInBlob(file)

    if (file.name) {
      formPost.append(opts.fieldName, dataWithUpdatedType, file.meta.name)
    } else {
      formPost.append(opts.fieldName, dataWithUpdatedType)
    }

    return formPost
  }

  createBundledUpload (files, opts) {
    const formPost = new FormData()

    const { meta } = this.uppy.getState()
    this.addMetadata(formPost, meta, opts)

    files.forEach((file) => {
      const options = this.getOptions(file)

      const dataWithUpdatedType = setTypeInBlob(file)

      if (file.name) {
        formPost.append(options.fieldName, dataWithUpdatedType, file.name)
      } else {
        formPost.append(options.fieldName, dataWithUpdatedType)
      }
    })

    return formPost
  }

  upload (file, current, total) {
    const opts = this.getOptions(file)

    this.uppy.log(`uploading ${current} of ${total}`)
    return new Promise((resolve, reject) => {
      this.uppy.emit('upload-started', file)

      const data = opts.formData
        ? this.createFormDataUpload(file, opts)
        : file.data

      const xhr = new XMLHttpRequest()
      this.uploaderEvents[file.id] = new EventTracker(this.uppy)
      let queuedRequest

      const timer = new ProgressTimeout(opts.timeout, () => {
        xhr.abort()
        queuedRequest.done()
        const error = new Error(this.i18n('timedOut', { seconds: Math.ceil(opts.timeout / 1000) }))
        this.uppy.emit('upload-error', file, error)
        reject(error)
      })

      const id = nanoid()

      xhr.upload.addEventListener('loadstart', () => {
        this.uppy.log(`[XHRUpload] ${id} started`)
      })

      xhr.upload.addEventListener('progress', (ev) => {
        this.uppy.log(`[XHRUpload] ${id} progress: ${ev.loaded} / ${ev.total}`)
        // Begin checking for timeouts when progress starts, instead of loading,
        // to avoid timing out requests on browser concurrency queue
        timer.progress()

        if (ev.lengthComputable) {
          this.uppy.emit('upload-progress', file, {
            uploader: this,
            bytesUploaded: ev.loaded,
            bytesTotal: ev.total,
          })
        }
      })

      xhr.addEventListener('load', () => {
        this.uppy.log(`[XHRUpload] ${id} finished`)
        timer.done()
        queuedRequest.done()
        if (this.uploaderEvents[file.id]) {
          this.uploaderEvents[file.id].remove()
          this.uploaderEvents[file.id] = null
        }

        if (opts.validateStatus(xhr.status, xhr.responseText, xhr)) {
          const body = opts.getResponseData(xhr.responseText, xhr)
          const uploadURL = body[opts.responseUrlFieldName]

          const uploadResp = {
            status: xhr.status,
            body,
            uploadURL,
          }

          this.uppy.emit('upload-success', file, uploadResp)

          if (uploadURL) {
            this.uppy.log(`Download ${file.name} from ${uploadURL}`)
          }

          return resolve(file)
        }
        const body = opts.getResponseData(xhr.responseText, xhr)
        const error = buildResponseError(xhr, opts.getResponseError(xhr.responseText, xhr))

        const response = {
          status: xhr.status,
          body,
        }

        this.uppy.emit('upload-error', file, error, response)
        return reject(error)
      })

      xhr.addEventListener('error', () => {
        this.uppy.log(`[XHRUpload] ${id} errored`)
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

      queuedRequest = this.requests.run(() => {
        this.uppy.emit('upload-started', file)

        // When using an authentication system like JWT, the bearer token goes as a header. This
        // header needs to be fresh each time the token is refreshed so computing and setting the
        // headers just before the upload starts enables this kind of authentication to work properly.
        // Otherwise, half-way through the list of uploads the token could be stale and the upload would fail.
        const currentOpts = this.getOptions(file)

        Object.keys(currentOpts.headers).forEach((header) => {
          xhr.setRequestHeader(header, currentOpts.headers[header])
        })

        xhr.send(data)

        return () => {
          timer.done()
          xhr.abort()
        }
      })

      this.onFileRemove(file.id, () => {
        queuedRequest.abort()
        reject(new Error('File removed'))
      })

      this.onCancelAll(file.id, ({ reason }) => {
        if (reason === 'user') {
          queuedRequest.abort()
        }
        reject(new Error('Upload cancelled'))
      })
    })
  }

  uploadRemote (file) {
    const opts = this.getOptions(file)
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
        httpMethod: opts.method,
        useFormData: opts.formData,
        headers: opts.headers,
      }).then((res) => {
        const { token } = res
        const host = getSocketHost(file.remote.companionUrl)
        const socket = new Socket({ target: `${host}/api/${token}`, autoOpen: false })
        this.uploaderEvents[file.id] = new EventTracker(this.uppy)
        let queuedRequest

        this.onFileRemove(file.id, () => {
          socket.send('cancel', {})
          queuedRequest.abort()
          resolve(`upload ${file.id} was removed`)
        })

        this.onCancelAll(file.id, ({ reason } = {}) => {
          if (reason === 'user') {
            socket.send('cancel', {})
            queuedRequest.abort()
          }
          resolve(`upload ${file.id} was canceled`)
        })

        this.onRetry(file.id, () => {
          socket.send('pause', {})
          socket.send('resume', {})
        })

        this.onRetryAll(file.id, () => {
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
            uploadURL,
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

        queuedRequest = this.requests.run(() => {
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

  uploadBundle (files) {
    return new Promise((resolve, reject) => {
      const { endpoint } = this.opts
      const { method } = this.opts

      const optsFromState = this.uppy.getState().xhrUpload
      const formData = this.createBundledUpload(files, {
        ...this.opts,
        ...(optsFromState || {}),
      })

      const xhr = new XMLHttpRequest()

      const emitError = (error) => {
        files.forEach((file) => {
          this.uppy.emit('upload-error', file, error)
        })
      }

      const timer = new ProgressTimeout(this.opts.timeout, () => {
        xhr.abort()
        const error = new Error(this.i18n('timedOut', { seconds: Math.ceil(this.opts.timeout / 1000) }))
        emitError(error)
        reject(error)
      })

      xhr.upload.addEventListener('loadstart', () => {
        this.uppy.log('[XHRUpload] started uploading bundle')
        timer.progress()
      })

      xhr.upload.addEventListener('progress', (ev) => {
        timer.progress()

        if (!ev.lengthComputable) return

        files.forEach((file) => {
          this.uppy.emit('upload-progress', file, {
            uploader: this,
            bytesUploaded: (ev.loaded / ev.total) * file.size,
            bytesTotal: file.size,
          })
        })
      })

      xhr.addEventListener('load', (ev) => {
        timer.done()

        if (this.opts.validateStatus(ev.target.status, xhr.responseText, xhr)) {
          const body = this.opts.getResponseData(xhr.responseText, xhr)
          const uploadResp = {
            status: ev.target.status,
            body,
          }
          files.forEach((file) => {
            this.uppy.emit('upload-success', file, uploadResp)
          })
          return resolve()
        }

        const error = this.opts.getResponseError(xhr.responseText, xhr) || new Error('Upload error')
        error.request = xhr
        emitError(error)
        return reject(error)
      })

      xhr.addEventListener('error', () => {
        timer.done()

        const error = this.opts.getResponseError(xhr.responseText, xhr) || new Error('Upload error')
        emitError(error)
        return reject(error)
      })

      this.uppy.on('cancel-all', ({ reason } = {}) => {
        if (reason !== 'user') return
        timer.done()
        xhr.abort()
      })

      xhr.open(method.toUpperCase(), endpoint, true)
      // IE10 does not allow setting `withCredentials` and `responseType`
      // before `open()` is called.
      xhr.withCredentials = this.opts.withCredentials
      if (this.opts.responseType !== '') {
        xhr.responseType = this.opts.responseType
      }

      Object.keys(this.opts.headers).forEach((header) => {
        xhr.setRequestHeader(header, this.opts.headers[header])
      })

      xhr.send(formData)

      files.forEach((file) => {
        this.uppy.emit('upload-started', file)
      })
    })
  }

  uploadFiles (files) {
    const promises = files.map((file, i) => {
      const current = parseInt(i, 10) + 1
      const total = files.length

      if (file.error) {
        return Promise.reject(new Error(file.error))
      } if (file.isRemote) {
        return this.uploadRemote(file, current, total)
      }
      return this.upload(file, current, total)
    })

    return settle(promises)
  }

  onFileRemove (fileID, cb) {
    this.uploaderEvents[fileID].on('file-removed', (file) => {
      if (fileID === file.id) cb(file.id)
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
    this.uploaderEvents[fileID].on('retry-all', () => {
      if (!this.uppy.getFile(fileID)) return
      cb()
    })
  }

  onCancelAll (fileID, eventHandler) {
    this.uploaderEvents[fileID].on('cancel-all', (...args) => {
      if (!this.uppy.getFile(fileID)) return
      eventHandler(...args)
    })
  }

  handleUpload (fileIDs) {
    if (fileIDs.length === 0) {
      this.uppy.log('[XHRUpload] No files to upload!')
      return Promise.resolve()
    }

    // No limit configured by the user, and no RateLimitedQueue passed in by a "parent" plugin
    // (basically just AwsS3) using the internal symbol
    if (this.opts.limit === 0 && !this.opts[internalRateLimitedQueue]) {
      this.uppy.log(
        '[XHRUpload] When uploading multiple files at once, consider setting the `limit` option (to `10` for example), to limit the number of concurrent uploads, which helps prevent memory and network issues: https://uppy.io/docs/xhr-upload/#limit-0',
        'warning',
      )
    }

    this.uppy.log('[XHRUpload] Uploading...')
    const files = fileIDs.map((fileID) => this.uppy.getFile(fileID))

    if (this.opts.bundle) {
      // if bundle: true, we don’t support remote uploads
      const isSomeFileRemote = files.some(file => file.isRemote)
      if (isSomeFileRemote) {
        throw new Error('Can’t upload remote files when the `bundle: true` option is set')
      }

      if (typeof this.opts.headers === 'function') {
        throw new TypeError('`headers` may not be a function when the `bundle: true` option is set')
      }

      return this.uploadBundle(files)
    }

    return this.uploadFiles(files).then(() => null)
  }

  install () {
    if (this.opts.bundle) {
      const { capabilities } = this.uppy.getState()
      this.uppy.setState({
        capabilities: {
          ...capabilities,
          individualCancellation: false,
        },
      })
    }

    this.uppy.addUploader(this.handleUpload)
  }

  uninstall () {
    if (this.opts.bundle) {
      const { capabilities } = this.uppy.getState()
      this.uppy.setState({
        capabilities: {
          ...capabilities,
          individualCancellation: true,
        },
      })
    }

    this.uppy.removeUploader(this.handleUpload)
  }
}
