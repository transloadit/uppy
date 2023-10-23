import BasePlugin from '@uppy/core/lib/BasePlugin.js'
import { Provider, RequestClient } from '@uppy/companion-client'
import NetworkError from '@uppy/utils/lib/NetworkError'
import isNetworkError from '@uppy/utils/lib/isNetworkError'
import { filterNonFailedFiles, filterFilesToEmitUploadStarted } from '@uppy/utils/lib/fileFilters'
import { fetcher, getUppyAbortController } from '@uppy/utils/lib/fetcher'

import packageJson from '../package.json'
import locale from './locale.js'

// TODO: do we really need this?
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

  #uppyFetch

  constructor(uppy, opts) {
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
      allowedMetaFields: null,
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

    this.uppy.queue.concurrency = this.opts.limit

    /**
     * xhr-upload wrapper for `fetcher` to handle user options
     * `validateStatus`, `getResponseError`, `getResponseData`
     * and to emit `upload-progress`, `upload-error`, and `upload-success` events.
     *
     * @param {import('@uppy/core').UppyFile[]} files
     */
    this.#uppyFetch = (files) => {
      /** @type {typeof fetcher} */
      return async (url, options) => {
        try {
          const response = await fetcher(url, {
            ...options,
            onUploadProgress: (event) => {
              if (event.lengthComputable) {
                for (const file of files) {
                  this.uppy.emit('upload-progress', file, {
                    uploader: this,
                    bytesUploaded: (event.loaded / event.total) * file.size,
                    bytesTotal: file.size,
                  })
                }
              }
            },
          })

          if (!this.opts.validateStatus(response.status)) {
            throw new NetworkError(response.statusText, response)
          }

          const body = await this.opts.getResponseData(response.responseText)
          const uploadUrl = body[this.opts.responseUrlFieldName]

          for (const file of files) {
            this.uppy.emit('upload-success', file, {
              status: response.status,
              body,
              uploadUrl,
            })
          }

          return response
        } catch (error) {
          if (error.name === 'AbortError') {
            return undefined
          }
          if (error instanceof NetworkError) {
            const { xhr } = error
            const customError = buildResponseError(
              xhr,
              this.opts.getResponseError(xhr.responseText, xhr),
            )
            for (const file of files) {
              this.uppy.emit('upload-error', file, customError)
            }
          }

          throw error
        }
      }
    }

    if (this.opts.bundle && !this.opts.formData) {
      throw new Error('`opts.formData` must be true when `opts.bundle` is enabled.')
    }

    if (opts?.allowedMetaFields === undefined && 'metaFields' in this.opts) {
      throw new Error('The `metaFields` option has been renamed to `allowedMetaFields`.')
    }

    if (opts.bundle && typeof this.opts.headers === 'function') {
      throw new TypeError('`headers` may not be a function when the `bundle: true` option is set')
    }
  }

  getOptions(file) {
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
    const allowedMetaFields = Array.isArray(opts.allowedMetaFields)
      ? opts.allowedMetaFields
      : Object.keys(meta) // Send along all fields by default.

    allowedMetaFields.forEach((item) => {
      if (Array.isArray(meta[item])) {
        // In this case we don't transform `item` to add brackets, it's up to
        // the user to add the brackets so it won't be overridden.
        meta[item].forEach(subItem => formData.append(item, subItem))
      } else {
        formData.append(item, meta[item])
      }
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

  async #uploadLocalFile(file) {
    const opts = this.getOptions(file)
    const uppyFetch = this.#uppyFetch([file])
    const body = opts.formData
      ? this.createFormDataUpload(file, opts)
      : file.data

    await this.uppy.queue.add(async () => {
      return uppyFetch(opts.endpoint, {
        method: opts.method,
        headers: opts.headers,
        body,
      })
    })

    return file
  }

  async #uploadBundle(files) {
    const { endpoint, method, headers } = this.opts
    const optsFromState = this.uppy.getState().xhrUpload ?? {}
    const uppyFetch = this.#uppyFetch(files)
    const { signal } = getUppyAbortController(this.uppy)
    const body = this.createBundledUpload(files, {
      ...this.opts,
      ...optsFromState,
    })

    await this.uppy.queue.add(async () => {
      return uppyFetch(endpoint, { method, body, headers, signal })
    })
  }

  #getCompanionClientArgs (file) {
    const opts = this.getOptions(file)
    const allowedMetaFields = Array.isArray(opts.allowedMetaFields)
      ? opts.allowedMetaFields
      // Send along all fields by default.
      : Object.keys(file.meta)
    return {
      ...file.remote.body,
      protocol: 'multipart',
      endpoint: opts.endpoint,
      size: file.data.size,
      fieldname: opts.fieldName,
      metadata: Object.fromEntries(allowedMetaFields.map(name => [name, file.meta[name]])),
      httpMethod: opts.method,
      useFormData: opts.formData,
      headers: opts.headers,
    }
  }

  async #uploadFiles (files) {
    await Promise.allSettled(files.map((file, i) => {
      const current = parseInt(i, 10) + 1
      const total = files.length

      if (file.isRemote) {
        // INFO: the url plugin needs to use RequestClient,
        // while others use Provider
        // TODO: would be nice if we can always use Provider with an option rather than RequestClient
        const Client = file.remote.providerOptions.provider ? Provider : RequestClient
        const client = new Client(this.uppy, file.remote.providerOptions)
        const reqBody = this.#getCompanionClientArgs(file)

        return client.uploadRemoteFile(file, reqBody)
      }

      return this.#uploadLocalFile(file, current, total)
    }))
  }

  #handleUpload = async (fileIDs) => {
    if (fileIDs.length === 0) {
      this.uppy.log('[XHRUpload] No files to upload!')
      return
    }

    // No limit configured by the user, and no RateLimitedQueue passed in by a "parent" plugin
    // (basically just AwsS3) using the internal symbol
    if (this.opts.limit === 0) {
      this.uppy.log(
        '[XHRUpload] When uploading multiple files at once, consider setting the `limit` option (to `10` for example), to limit the number of concurrent uploads, which helps prevent memory and network issues: https://uppy.io/docs/xhr-upload/#limit-0',
        'warning',
      )
    }

    this.uppy.log('[XHRUpload] Uploading...')
    const files = this.uppy.getFilesByIds(fileIDs)

    const filesFiltered = filterNonFailedFiles(files)
    const filesToEmit = filterFilesToEmitUploadStarted(filesFiltered)
    this.uppy.emit('upload-start', filesToEmit)

    if (this.opts.bundle) {
      // if bundle: true, we don’t support remote uploads
      const isSomeFileRemote = filesFiltered.some(file => file.isRemote)
      if (isSomeFileRemote) {
        throw new Error('Can’t upload remote files when the `bundle: true` option is set')
      }

      if (typeof this.opts.headers === 'function') {
        throw new TypeError('`headers` may not be a function when the `bundle: true` option is set')
      }

      await this.#uploadBundle(filesFiltered)
    } else {
      await this.#uploadFiles(filesFiltered)
    }
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

    this.uppy.addUploader(this.#handleUpload)
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

    this.uppy.removeUploader(this.#handleUpload)
  }
}
