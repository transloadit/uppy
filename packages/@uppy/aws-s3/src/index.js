/**
 * This plugin is currently a A Big Hack™! The core reason for that is how this plugin
 * interacts with Uppy's current pipeline design. The pipeline can handle files in steps,
 * including preprocessing, uploading, and postprocessing steps. This plugin initially
 * was designed to do its work in a preprocessing step, and let XHRUpload deal with the
 * actual file upload as an uploading step. However, Uppy runs steps on all files at once,
 * sequentially: first, all files go through a preprocessing step, then, once they are all
 * done, they go through the uploading step.
 *
 * For S3, this causes severely broken behaviour when users upload many files. The
 * preprocessing step will request S3 upload URLs that are valid for a short time only,
 * but it has to do this for _all_ files, which can take a long time if there are hundreds
 * or even thousands of files. By the time the uploader step starts, the first URLs may
 * already have expired. If not, the uploading might take such a long time that later URLs
 * will expire before some files can be uploaded.
 *
 * The long-term solution to this problem is to change the upload pipeline so that files
 * can be sent to the next step individually. That requires a breaking change, so it is
 * planned for some future Uppy version.
 *
 * In the mean time, this plugin is stuck with a hackier approach: the necessary parts
 * of the XHRUpload implementation were copied into this plugin, as the MiniXHRUpload
 * class, and this plugin calls into it immediately once it receives an upload URL.
 * This isn't as nicely modular as we'd like and requires us to maintain two copies of
 * the XHRUpload code, but at least it's not horrifically broken :)
 */

import BasePlugin from '@uppy/core/lib/BasePlugin.js'
import AwsS3Multipart from '@uppy/aws-s3-multipart'
import { RateLimitedQueue, internalRateLimitedQueue } from '@uppy/utils/lib/RateLimitedQueue'
import { RequestClient } from '@uppy/companion-client'
import { filterNonFailedFiles, filterFilesToEmitUploadStarted } from '@uppy/utils/lib/fileFilters'

import packageJson from '../package.json'
import MiniXHRUpload from './MiniXHRUpload.js'
import isXml from './isXml.js'
import locale from './locale.js'

function resolveUrl (origin, link) {
  // DigitalOcean doesn’t return the protocol from Location
  // without it, the `new URL` constructor will fail
  if (!origin && !link.startsWith('https://') && !link.startsWith('http://')) {
    link = `https://${link}` // eslint-disable-line no-param-reassign
  }
  return new URL(link, origin || undefined).toString()
}

/**
 * Get the contents of a named tag in an XML source string.
 *
 * @param {string} source - The XML source string.
 * @param {string} tagName - The name of the tag.
 * @returns {string} The contents of the tag, or the empty string if the tag does not exist.
 */
function getXmlValue (source, tagName) {
  const start = source.indexOf(`<${tagName}>`)
  const end = source.indexOf(`</${tagName}>`, start)
  return start !== -1 && end !== -1
    ? source.slice(start + tagName.length + 2, end)
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

function validateParameters (file, params) {
  const valid = params != null
    && typeof params.url === 'string'
    && (typeof params.fields === 'object' || params.fields == null)

  if (!valid) {
    const err = new TypeError(`AwsS3: got incorrect result from 'getUploadParameters()' for file '${file.name}', expected an object '{ url, method, fields, headers }' but got '${JSON.stringify(params)}' instead.\nSee https://uppy.io/docs/aws-s3/#getUploadParameters-file for more on the expected format.`)
    throw err
  }

  const methodIsValid = params.method == null || /^p(u|os)t$/i.test(params.method)

  if (!methodIsValid) {
    const err = new TypeError(`AwsS3: got incorrect method from 'getUploadParameters()' for file '${file.name}', expected  'PUT' or 'POST' but got '${params.method}' instead.\nSee https://uppy.io/docs/aws-s3/#getUploadParameters-file for more on the expected format.`)
    throw err
  }
}

// Get the error data from a failed XMLHttpRequest instance.
// `content` is the S3 response as a string.
// `xhr` is the XMLHttpRequest instance.
function defaultGetResponseError (content, xhr) {
  // If no response, we don't have a specific error message, use the default.
  if (!isXml(content, xhr)) {
    return undefined
  }
  const error = getXmlValue(content, 'Message')
  return new Error(error)
}

// warning deduplication flag: see `getResponseData()` XHRUpload option definition
let warnedSuccessActionStatus = false

// TODO deprecate this, will use s3-multipart instead
export default class AwsS3 extends BasePlugin {
  static VERSION = packageJson.version

  #client

  #requests

  #uploader

  constructor (uppy, opts) {
    // Opt-in to using the multipart plugin, which is going to be the only S3 plugin as of the next semver.
    if (opts?.shouldUseMultipart != null) {
      return new AwsS3Multipart(uppy, opts)
    }
    super(uppy, opts)
    this.type = 'uploader'
    this.id = this.opts.id || 'AwsS3'
    this.title = 'AWS S3'

    this.defaultLocale = locale

    const defaultOptions = {
      timeout: 30 * 1000,
      limit: 0,
      allowedMetaFields: [], // have to opt in
      getUploadParameters: this.getUploadParameters.bind(this),
      shouldUseMultipart: false,
      companionHeaders: {},
    }

    this.opts = { ...defaultOptions, ...opts }

    if (opts?.allowedMetaFields === undefined && 'metaFields' in this.opts) {
      throw new Error('The `metaFields` option has been renamed to `allowedMetaFields`.')
    }

    // TODO: remove i18n once we can depend on XHRUpload instead of MiniXHRUpload
    this.i18nInit()

    this.#client = new RequestClient(uppy, opts)
    this.#requests = new RateLimitedQueue(this.opts.limit)
  }

  [Symbol.for('uppy test: getClient')] () { return this.#client }

  // TODO: remove getter and setter for #client on the next major release
  get client () { return this.#client }

  set client (client) { this.#client = client }

  getUploadParameters (file) {
    if (!this.opts.companionUrl) {
      throw new Error('Expected a `companionUrl` option containing a Companion address.')
    }

    const filename = file.meta.name
    const { type } = file.meta
    const metadata = Object.fromEntries(
      this.opts.allowedMetaFields
        .filter(key => file.meta[key] != null)
        .map(key => [`metadata[${key}]`, file.meta[key].toString()]),
    )

    const query = new URLSearchParams({ filename, type, ...metadata })
    return this.#client.get(`s3/params?${query}`)
      .then(assertServerError)
  }

  #handleUpload = async (fileIDs) => {
    /**
     * keep track of `getUploadParameters()` responses
     * so we can cancel the calls individually using just a file ID
     *
     * @type {Record<string, import('@uppy/utils/lib/RateLimitedQueue').AbortablePromise<unknown>>}
     */
    const paramsPromises = Object.create(null)

    function onremove (file) {
      const { id } = file
      paramsPromises[id]?.abort()
    }
    this.uppy.on('file-removed', onremove)

    const files = this.uppy.getFilesByIds(fileIDs)

    const filesFiltered = filterNonFailedFiles(files)
    const filesToEmit = filterFilesToEmitUploadStarted(filesFiltered)
    this.uppy.emit('upload-start', filesToEmit)

    const getUploadParameters = this.#requests.wrapPromiseFunction((file) => {
      return this.opts.getUploadParameters(file)
    })

    const numberOfFiles = fileIDs.length

    return Promise.allSettled(fileIDs.map((id, index) => {
      paramsPromises[id] = getUploadParameters(this.uppy.getFile(id))
      return paramsPromises[id].then((params) => {
        delete paramsPromises[id]

        const file = this.uppy.getFile(id)
        validateParameters(file, params)

        const {
          method = 'POST',
          url,
          fields,
          headers,
        } = params
        const xhrOpts = {
          method,
          formData: method.toUpperCase() === 'POST',
          endpoint: url,
          allowedMetaFields: fields ? Object.keys(fields) : [],
        }

        if (headers) {
          xhrOpts.headers = headers
        }

        this.uppy.setFileState(file.id, {
          meta: { ...file.meta, ...fields },
          xhrUpload: xhrOpts,
        })

        return this.uploadFile(file.id, index, numberOfFiles)
      }).catch((error) => {
        delete paramsPromises[id]

        const file = this.uppy.getFile(id)
        this.uppy.emit('upload-error', file, error)
        return Promise.reject(error)
      })
    })).finally(() => {
      // cleanup.
      this.uppy.off('file-removed', onremove)
    })
  }

  #setCompanionHeaders = () => {
    this.#client.setCompanionHeaders(this.opts.companionHeaders)
    return Promise.resolve()
  }

  #getCompanionClientArgs = (file) => {
    const opts = this.#uploader.getOptions(file)
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
      headers: typeof opts.headers === 'function' ? opts.headers(file) : opts.headers,
    }
  }

  uploadFile (id, current, total) {
    const file = this.uppy.getFile(id)
    this.uppy.log(`uploading ${current} of ${total}`)

    if (file.error) throw new Error(file.error)

    if (file.isRemote) {
      const getQueue = () => this.#requests
      const controller = new AbortController()

      const removedHandler = (removedFile) => {
        if (removedFile.id === file.id) controller.abort()
      }
      this.uppy.on('file-removed', removedHandler)

      const uploadPromise = this.uppy.getRequestClientForFile(file).uploadRemoteFile(
        file,
        this.#getCompanionClientArgs(file),
        { signal: controller.signal, getQueue },
      )

      this.#requests.wrapSyncFunction(() => {
        this.uppy.off('file-removed', removedHandler)
      }, { priority: -1 })()

      return uploadPromise
    }

    return this.#uploader.uploadLocalFile(file, current, total)
  }

  install () {
    const { uppy } = this
    uppy.addPreProcessor(this.#setCompanionHeaders)
    uppy.addUploader(this.#handleUpload)

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
        etag: getXmlValue(content, 'ETag'),
      }
    }

    const xhrOptions = {
      fieldName: 'file',
      responseUrlFieldName: 'location',
      timeout: this.opts.timeout,
      // Share the rate limiting queue with XHRUpload.
      [internalRateLimitedQueue]: this.#requests,
      responseType: 'text',
      getResponseData: this.opts.getResponseData || defaultGetResponseData,
      getResponseError: defaultGetResponseError,
    }

    // TODO: remove i18n once we can depend on XHRUpload instead of MiniXHRUpload
    xhrOptions.i18n = this.i18n

    // Revert to `uppy.use(XHRUpload)` once the big comment block at the top of
    // this file is solved
    this.#uploader = new MiniXHRUpload(uppy, xhrOptions)
  }

  uninstall () {
    this.uppy.removePreProcessor(this.#setCompanionHeaders)
    this.uppy.removeUploader(this.#handleUpload)
  }
}
