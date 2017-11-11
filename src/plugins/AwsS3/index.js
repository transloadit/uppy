const Plugin = require('../Plugin')
const XHRUpload = require('../XHRUpload')

module.exports = class AwsS3 extends Plugin {
  constructor (core, opts) {
    super(core, opts)
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
      this.core.emit('core:preprocess-progress', id, {
        mode: 'determinate',
        message: this.locale.strings.preparingUpload,
        value: 0
      })
    })

    return Promise.all(
      fileIDs.map((id) => {
        const file = this.core.getFile(id)
        const paramsPromise = Promise.resolve()
          .then(() => this.opts.getUploadParameters(file))
        return paramsPromise.then((params) => {
          this.core.emit('core:preprocess-progress', file.id, {
            mode: 'determinate',
            message: this.locale.strings.preparingUpload,
            value: 1
          })
          return params
        }).catch((error) => {
          this.core.emit('core:upload-error', file.id, error)
        })
      })
    ).then((responses) => {
      const updatedFiles = {}
      fileIDs.forEach((id, index) => {
        const file = this.core.getFile(id)
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

      this.core.setState({
        files: Object.assign({}, this.core.getState().files, updatedFiles)
      })

      fileIDs.forEach((id) => {
        this.core.emit('core:preprocess-complete', id)
      })
    })
  }

  install () {
    this.core.addPreProcessor(this.prepareUpload)

    this.core.use(XHRUpload, {
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
    })
  }

  uninstall () {
    const uploader = this.core.getPlugin('XHRUpload')
    this.core.removePlugin(uploader)

    this.core.removePreProcessor(this.prepareUpload)
  }
}
