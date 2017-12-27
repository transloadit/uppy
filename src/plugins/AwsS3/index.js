const Plugin = require('../../core/Plugin')
const Translator = require('../../core/Translator')
const XHRUpload = require('../XHRUpload')

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
      getUploadParameters: this.getUploadParameters.bind(this),
      locale: defaultLocale
    }

    this.opts = Object.assign({}, defaultOptions, opts)
    this.locale = Object.assign({}, defaultLocale, this.opts.locale)
    this.locale.strings = Object.assign({}, defaultLocale.strings, this.opts.locale.strings)

    this.translator = new Translator({ locale: this.locale })
    this.i18n = this.translator.translate.bind(this.translator)

    this.prepareUpload = this.prepareUpload.bind(this)
  }

  getUploadParameters (file) {
    if (!this.opts.host) {
      throw new Error('Expected a `host` option containing an uppy-server address.')
    }

    const filename = encodeURIComponent(file.name)
    const type = encodeURIComponent(file.type)
    return fetch(`${this.opts.host}/s3/params?filename=${filename}&type=${type}`, {
      method: 'get',
      headers: { accept: 'application/json' }
    }).then((response) => response.json())
  }

  prepareUpload (fileIDs) {
    fileIDs.forEach((id) => {
      this.uppy.emit('preprocess-progress', id, {
        mode: 'determinate',
        message: this.i18n('preparingUpload'),
        value: 0
      })
    })

    return Promise.all(
      fileIDs.map((id) => {
        const file = this.uppy.getFile(id)
        const paramsPromise = Promise.resolve()
          .then(() => this.opts.getUploadParameters(file))
        return paramsPromise.then((params) => {
          this.uppy.emit('preprocess-progress', file.id, {
            mode: 'determinate',
            message: this.i18n('preparingUpload'),
            value: 1
          })
          return params
        }).catch((error) => {
          this.uppy.emit('upload-error', file.id, error)
        })
      })
    ).then((responses) => {
      const updatedFiles = {}
      fileIDs.forEach((id, index) => {
        const file = this.uppy.getFile(id)
        if (file.error) {
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
        this.uppy.emit('preprocess-complete', id)
      })
    })
  }

  install () {
    this.uppy.addPreProcessor(this.prepareUpload)

    this.uppy.use(XHRUpload, Object.assign({
      fieldName: 'file',
      responseUrlFieldName: 'location',
      getResponseData (xhr) {
        // If no response, we've hopefully done a PUT request to the file
        // in the bucket on its full URL.
        if (!xhr.responseXML) {
          return { location: xhr.responseURL }
        }
        function getValue (key) {
          const el = xhr.responseXML.querySelector(key)
          return el ? el.textContent : ''
        }
        return {
          location: getValue('Location'),
          bucket: getValue('Bucket'),
          key: getValue('Key'),
          etag: getValue('ETag')
        }
      },
      getResponseError (xhr) {
        // If no response, we don't have a specific error message, use the default.
        if (!xhr.responseXML) {
          return
        }
        const error = xhr.responseXML.querySelector('Error > Message')
        return new Error(error.textContent)
      }
    }, this.opts.xhrOptions || {}))
  }

  uninstall () {
    const uploader = this.uppy.getPlugin('XHRUpload')
    this.uppy.removePlugin(uploader)

    this.uppy.removePreProcessor(this.prepareUpload)
  }
}
