const Plugin = require('../Plugin')

module.exports = class AwsS3 extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'uploader'
    this.id = 'AwsS3'
    this.title = 'AWS S3'

    const defaultOptions = {
      getUploadParameters: this.getUploadParameters.bind(this)
    }

    this.opts = Object.assign({}, defaultOptions, opts)

    this.prepareUpload = this.prepareUpload.bind(this)
  }

  getFile (id) {
    return this.core.getState().files[id]
  }

  getUploadParameters (file) {
    if (!this.opts.host) {
      throw new Error('Expected a `host` option containing an uppy-server address.')
    }

    const filename = encodeURIComponent(file.name)
    const type = encodeURIComponent(`${file.type.general}/${file.type.specific}`)
    return fetch(`${this.opts.host}/s3/params?filename=${filename}&type=${type}`, {
      method: 'get',
      headers: { accept: 'application/json' }
    }).then((response) => response.json())
  }

  prepareUpload (fileIDs) {
    fileIDs.forEach((id) => {
      this.core.emit('core:preprocess-progress', id, {
        mode: 'determinate',
        message: 'Preparing upload...',
        value: 0
      })
    })

    return Promise.all(
      fileIDs.map((id) => {
        const file = this.getFile(id)
        return this.opts.getUploadParameters(file).then((params) => {
          this.core.emit('core:preprocess-progress', file.id, {
            mode: 'determinate',
            message: 'Preparing upload...',
            value: 1
          })
          return params
        })
      })
    ).then((responses) => {
      const updatedFiles = {}
      fileIDs.forEach((id, index) => {
        const file = this.getFile(id)
        const { endpoint, params } = responses[index]
        const updatedFile = Object.assign({}, file, {
          meta: Object.assign({}, file.meta, params),
          multipart: {
            endpoint,
            fieldName: 'file',
            metaFields: Object.keys(params),
            getUploadUrl (xhr) {
              const locationEl = xhr.responseXML.querySelector('Location')
              return locationEl.textContent
            }
          }
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
  }

  uninstall () {
    this.core.removePreProcessor(this.prepareUpload)
  }
}
