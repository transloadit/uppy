import { nanoid } from 'nanoid/non-secure'
import EventManager from '@uppy/utils/lib/EventManager'
import ProgressTimeout from '@uppy/utils/lib/ProgressTimeout'
import ErrorWithCause from '@uppy/utils/lib/ErrorWithCause'
import NetworkError from '@uppy/utils/lib/NetworkError'
import isNetworkError from '@uppy/utils/lib/isNetworkError'
import { internalRateLimitedQueue } from '@uppy/utils/lib/RateLimitedQueue'

// See XHRUpload
function buildResponseError (xhr, error) {
  if (isNetworkError(xhr)) return new NetworkError(error, xhr)

  const err = new ErrorWithCause('Upload error', { cause: error })
  err.request = xhr
  return err
}

// See XHRUpload
function setTypeInBlob (file) {
  const dataWithUpdatedType = file.data.slice(0, file.data.size, file.meta.type)
  return dataWithUpdatedType
}

function addMetadata (formData, meta, opts) {
  const allowedMetaFields = Array.isArray(opts.allowedMetaFields)
    ? opts.allowedMetaFields
    // Send along all fields by default.
    : Object.keys(meta)
  allowedMetaFields.forEach((item) => {
    formData.append(item, meta[item])
  })
}

function createFormDataUpload (file, opts) {
  const formPost = new FormData()

  addMetadata(formPost, file.meta, opts)

  const dataWithUpdatedType = setTypeInBlob(file)

  if (file.name) {
    formPost.append(opts.fieldName, dataWithUpdatedType, file.meta.name)
  } else {
    formPost.append(opts.fieldName, dataWithUpdatedType)
  }

  return formPost
}

const createBareUpload = file => file.data

export default class MiniXHRUpload {
  constructor (uppy, opts) {
    this.uppy = uppy
    this.opts = {
      validateStatus (status) {
        return status >= 200 && status < 300
      },
      ...opts,
    }

    this.requests = opts[internalRateLimitedQueue]
    this.uploaderEvents = Object.create(null)
    this.i18n = opts.i18n
  }

  getOptions (file) {
    const { uppy } = this

    const overrides = uppy.getState().xhrUpload
    const opts = {
      ...this.opts,
      ...(overrides || {}),
      ...(file.xhrUpload || {}),
      headers: {
        ...this.opts.headers,
        ...overrides?.headers,
        ...file.xhrUpload?.headers,
      },
    }

    return opts
  }

  #addEventHandlerForFile (eventName, fileID, eventHandler) {
    this.uploaderEvents[fileID].on(eventName, (fileOrID) => {
      // TODO (major): refactor Uppy events to consistently send file objects (or consistently IDs)
      // We created a generic `addEventListenerForFile` but not all events
      // use file IDs, some use files, so we need to do this weird check.
      const id = fileOrID?.id ?? fileOrID
      if (fileID === id) eventHandler()
    })
  }

  #addEventHandlerIfFileStillExists (eventName, fileID, eventHandler) {
    this.uploaderEvents[fileID].on(eventName, (...args) => {
      if (this.uppy.getFile(fileID)) eventHandler(...args)
    })
  }

  uploadLocalFile (file) {
    const opts = this.getOptions(file)

    return new Promise((resolve, reject) => {
      // This is done in index.js in the S3 plugin.
      // this.uppy.emit('upload-started', file)

      const data = opts.formData
        ? createFormDataUpload(file, opts)
        : createBareUpload(file, opts)

      const xhr = new XMLHttpRequest()
      this.uploaderEvents[file.id] = new EventManager(this.uppy)

      const timer = new ProgressTimeout(opts.timeout, () => {
        xhr.abort()
        // eslint-disable-next-line no-use-before-define
        queuedRequest.done()
        const error = new Error(this.i18n('timedOut', { seconds: Math.ceil(opts.timeout / 1000) }))
        this.uppy.emit('upload-error', file, error)
        reject(error)
      })

      const id = nanoid()

      xhr.upload.addEventListener('loadstart', () => {
        this.uppy.log(`[AwsS3/XHRUpload] ${id} started`)
      })

      xhr.upload.addEventListener('progress', (ev) => {
        this.uppy.log(`[AwsS3/XHRUpload] ${id} progress: ${ev.loaded} / ${ev.total}`)
        // Begin checking for timeouts when progress starts, instead of loading,
        // to avoid timing out requests on browser concurrency queue
        timer.progress()

        if (ev.lengthComputable) {
          this.uppy.emit('upload-progress', this.uppy.getFile(file.id), {
            uploader: this,
            bytesUploaded: ev.loaded,
            bytesTotal: ev.total,
          })
        }
      })

      xhr.addEventListener('load', (ev) => {
        this.uppy.log(`[AwsS3/XHRUpload] ${id} finished`)
        timer.done()
        // eslint-disable-next-line no-use-before-define
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
            uploadURL,
          }

          this.uppy.emit('upload-success', this.uppy.getFile(file.id), uploadResp)

          if (uploadURL) {
            this.uppy.log(`Download ${file.name} from ${uploadURL}`)
          }

          return resolve(file)
        }
        const body = opts.getResponseData(xhr.responseText, xhr)
        const error = buildResponseError(xhr, opts.getResponseError(xhr.responseText, xhr))

        const response = {
          status: ev.target.status,
          body,
        }

        this.uppy.emit('upload-error', file, error, response)
        return reject(error)
      })

      xhr.addEventListener('error', () => {
        this.uppy.log(`[AwsS3/XHRUpload] ${id} errored`)
        timer.done()
        // eslint-disable-next-line no-use-before-define
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
      // before `open()` is called. It’s important to set withCredentials
      // to a boolean, otherwise React Native crashes
      xhr.withCredentials = Boolean(opts.withCredentials)
      if (opts.responseType !== '') {
        xhr.responseType = opts.responseType
      }

      Object.keys(opts.headers).forEach((header) => {
        xhr.setRequestHeader(header, opts.headers[header])
      })

      const queuedRequest = this.requests.run(() => {
        xhr.send(data)
        return () => {
          // eslint-disable-next-line no-use-before-define
          timer.done()
          xhr.abort()
        }
      }, { priority: 1 })

      this.#addEventHandlerForFile('file-removed', file.id, () => {
        queuedRequest.abort()
        reject(new Error('File removed'))
      })

      this.#addEventHandlerIfFileStillExists('cancel-all', file.id, ({ reason } = {}) => {
        if (reason === 'user') {
          queuedRequest.abort()
        }
        reject(new Error('Upload cancelled'))
      })
    })
  }
}
