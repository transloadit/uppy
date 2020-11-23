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
 * can be sent to the next step individually. That requires a breakig change, so it is
 * planned for Uppy v2.
 *
 * In the mean time, this plugin is stuck with a hackier approach: the necessary parts
 * of the XHRUpload implementation were copied into this plugin, as the MiniXHRUpload
 * class, and this plugin calls into it immediately once it receives an upload URL.
 * This isn't as nicely modular as we'd like and requires us to maintain two copies of
 * the XHRUpload code, but at least it's not horrifically broken :)
 */

// If global `URL` constructor is available, use it
const URL_ = typeof URL === 'function' ? URL : require('url-parse')
const { Plugin } = require('@uppy/core')
const Translator = require('@uppy/utils/lib/Translator')
const RateLimitedQueue = require('@uppy/utils/lib/RateLimitedQueue')
const settle = require('@uppy/utils/lib/settle')
const hasProperty = require('@uppy/utils/lib/hasProperty')
const { RequestClient } = require('@uppy/companion-client')
const qsStringify = require('qs-stringify')
const MiniXHRUpload = require('./MiniXHRUpload')
const isXml = require('./isXml')

function resolveUrl (origin, link) {
  return origin
    ? new URL_(link, origin).toString()
    : new URL_(link).toString()
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

// warning deduplication flag: see `getResponseData()` XHRUpload option definition
let warnedSuccessActionStatus = false

module.exports = class AwsS3 extends Plugin {
  static VERSION = require('../package.json').version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'uploader'
    this.id = this.opts.id || 'AwsS3'
    this.title = 'AWS S3'

    this.defaultLocale = {
      strings: {
        timedOut: 'Upload stalled for %{seconds} seconds, aborting.'
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

    const filename = file.meta.name
    const type = file.meta.type
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
      (typeof params.fields === 'object' || params.fields == null)

    if (!valid) {
      const err = new TypeError(`AwsS3: got incorrect result from 'getUploadParameters()' for file '${file.name}', expected an object '{ url, method, fields, headers }' but got '${JSON.stringify(params)}' instead.\nSee https://uppy.io/docs/aws-s3/#getUploadParameters-file for more on the expected format.`)
      console.error(err)
      throw err
    }

    const methodIsValid = params.method == null || /^(put|post)$/i.test(params.method)

    if (!methodIsValid) {
      const err = new TypeError(`AwsS3: got incorrect method from 'getUploadParameters()' for file '${file.name}', expected  'put' or 'post' but got '${params.method}' instead.\nSee https://uppy.io/docs/aws-s3/#getUploadParameters-file for more on the expected format.`)
      console.error(err)
      throw err
    }
  }

  handleUpload (fileIDs) {
    /**
     * keep track of `getUploadParameters()` responses
     * so we can cancel the calls individually using just a file ID
     *
     * @type {object.<string, Promise>}
     */
    const paramsPromises = Object.create(null)

    function onremove (file) {
      const { id } = file
      if (hasProperty(paramsPromises, id)) {
        paramsPromises[id].abort()
      }
    }
    this.uppy.on('file-removed', onremove)

    fileIDs.forEach((id) => {
      const file = this.uppy.getFile(id)
      this.uppy.emit('upload-started', file)
    })

    const getUploadParameters = this.requests.wrapPromiseFunction((file) => {
      return this.opts.getUploadParameters(file)
    })

    const numberOfFiles = fileIDs.length

    return settle(fileIDs.map((id, index) => {
      paramsPromises[id] = getUploadParameters(this.uppy.getFile(id))
      return paramsPromises[id].then((params) => {
        delete paramsPromises[id]

        const file = this.uppy.getFile(id)
        this.validateParameters(file, params)

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

        return this._uploader.uploadFile(file.id, index, numberOfFiles)
      }).catch((error) => {
        delete paramsPromises[id]

        const file = this.uppy.getFile(id)
        this.uppy.emit('upload-error', file, error)
      })
    })).then((settled) => {
      // cleanup.
      this.uppy.off('file-removed', onremove)
      return settled
    })
  }

  install () {
    const uppy = this.uppy
    this.uppy.addUploader(this.handleUpload)

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

    const xhrOptions = {
      fieldName: 'file',
      responseUrlFieldName: 'location',
      timeout: this.opts.timeout,
      // Share the rate limiting queue with XHRUpload.
      __queue: this.requests,
      responseType: 'text',
      getResponseData: this.opts.getResponseData || defaultGetResponseData,
      getResponseError: defaultGetResponseError
    }

    // Only for MiniXHRUpload, remove once we can depend on XHRUpload directly again
    xhrOptions.i18n = this.i18n

    // Revert to `this.uppy.use(XHRUpload)` once the big comment block at the top of
    // this file is solved
    this._uploader = new MiniXHRUpload(this.uppy, xhrOptions)
  }

  uninstall () {
    this.uppy.removePreProcessor(this.handleUpload)
  }
}
