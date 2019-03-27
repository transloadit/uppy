const resolveUrl = require('resolve-url')
const { Plugin } = require('@uppy/core')
const Translator = require('@uppy/utils/lib/Translator')
const limitPromises = require('@uppy/utils/lib/limitPromises')
const { RequestClient } = require('@uppy/companion-client')
const XHRUpload = require('@uppy/xhr-upload')

function isXml (xhr) {
  const contentType = xhr.headers ? xhr.headers['content-type'] : xhr.getResponseHeader('Content-Type')
  return typeof contentType === 'string' && contentType.toLowerCase() === 'application/xml'
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

module.exports = class AwsS3 extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'uploader'
    this.id = 'AwsS3'
    this.title = 'AWS S3'

    const defaultLocale = {
      strings: {
        preparingUpload: 'Preparing upload...'
      }
    }

    const defaultOptions = {
      timeout: 30 * 1000,
      limit: 0,
      getUploadParameters: this.getUploadParameters.bind(this),
      locale: defaultLocale
    }

    this.opts = { ...defaultOptions, ...opts }

    // i18n
    this.translator = new Translator([ defaultLocale, this.uppy.locale, this.opts.locale ])
    this.i18n = this.translator.translate.bind(this.translator)
    this.i18nArray = this.translator.translateArray.bind(this.translator)

    this.client = new RequestClient(uppy, opts)

    this.prepareUpload = this.prepareUpload.bind(this)

    if (typeof this.opts.limit === 'number' && this.opts.limit !== 0) {
      this.limitRequests = limitPromises(this.opts.limit)
    } else {
      this.limitRequests = (fn) => fn
    }
  }

  getUploadParameters (file) {
    if (!this.opts.serverUrl) {
      throw new Error('Expected a `serverUrl` option containing a Companion address.')
    }

    const filename = encodeURIComponent(file.meta.name)
    const type = encodeURIComponent(file.meta.type)
    return this.client.get(`s3/params?filename=${filename}&type=${type}`)
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

  prepareUpload (fileIDs) {
    fileIDs.forEach((id) => {
      const file = this.uppy.getFile(id)
      this.uppy.emit('preprocess-progress', file, {
        mode: 'determinate',
        message: this.i18n('preparingUpload'),
        value: 0
      })
    })

    const getUploadParameters = this.limitRequests(this.opts.getUploadParameters)

    return Promise.all(
      fileIDs.map((id) => {
        const file = this.uppy.getFile(id)
        const paramsPromise = Promise.resolve()
          .then(() => getUploadParameters(file))
        return paramsPromise.then((params) => {
          return this.validateParameters(file, params)
        }).then((params) => {
          this.uppy.emit('preprocess-progress', file, {
            mode: 'determinate',
            message: this.i18n('preparingUpload'),
            value: 1
          })
          return params
        }).catch((error) => {
          this.uppy.emit('upload-error', file, error)
        })
      })
    ).then((responses) => {
      const updatedFiles = {}
      fileIDs.forEach((id, index) => {
        const file = this.uppy.getFile(id)
        if (!file || file.error) {
          return
        }

        const {
          method = 'post',
          url,
          fields,
          headers
        } = responses[index]
        const xhrOpts = {
          method,
          formData: method.toLowerCase() === 'post',
          endpoint: url,
          metaFields: Object.keys(fields)
        }

        if (headers) {
          xhrOpts.headers = headers
        }

        const updatedFile = Object.assign({}, file, {
          meta: Object.assign({}, file.meta, fields),
          xhrUpload: xhrOpts
        })

        updatedFiles[id] = updatedFile
      })

      this.uppy.setState({
        files: Object.assign({}, this.uppy.getState().files, updatedFiles)
      })

      fileIDs.forEach((id) => {
        const file = this.uppy.getFile(id)
        this.uppy.emit('preprocess-complete', file)
      })
    })
  }

  install () {
    const { log } = this.uppy
    this.uppy.addPreProcessor(this.prepareUpload)

    let warnedSuccessActionStatus = false
    this.uppy.use(XHRUpload, {
      fieldName: 'file',
      responseUrlFieldName: 'location',
      timeout: this.opts.timeout,
      limit: this.opts.limit,
      responseType: 'text',
      // Get the response data from a successful XMLHttpRequest instance.
      // `content` is the S3 response as a string.
      // `xhr` is the XMLHttpRequest instance.
      getResponseData (content, xhr) {
        const opts = this

        // If no response, we've hopefully done a PUT request to the file
        // in the bucket on its full URL.
        if (!isXml(xhr)) {
          if (opts.method.toUpperCase() === 'POST') {
            if (!warnedSuccessActionStatus) {
              log('[AwsS3] No response data found, make sure to set the success_action_status AWS SDK option to 201. See https://uppy.io/docs/aws-s3/#POST-Uploads', 'warning')
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
      },

      // Get the error data from a failed XMLHttpRequest instance.
      // `content` is the S3 response as a string.
      // `xhr` is the XMLHttpRequest instance.
      getResponseError (content, xhr) {
        // If no response, we don't have a specific error message, use the default.
        if (!isXml(xhr)) {
          return
        }
        const error = getXmlValue(content, 'Message')
        return new Error(error)
      }
    })
  }

  uninstall () {
    const uploader = this.uppy.getPlugin('XHRUpload')
    this.uppy.removePlugin(uploader)

    this.uppy.removePreProcessor(this.prepareUpload)
  }
}
