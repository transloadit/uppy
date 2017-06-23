const Plugin = require('../Plugin')

module.exports = class AwsS3 extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'uploader'
    this.id = 'AwsS3'
    this.title = 'AWS S3'

    const defaultOptions = {
    }

    this.opts = Object.assign({}, defaultOptions, opts)

    this.prepareUpload = this.prepareUpload.bind(this)
  }

  getFile (id) {
    return this.core.getState().files[id]
  }

  getCredentials (fileID) {
    const file = this.getFile(fileID)

    const filename = encodeURIComponent(file.name)
    const type = encodeURIComponent(`${file.type.general}/${file.type.specific}`)
    return fetch(`${this.opts.host}/s3/credentials?filename=${filename}&type=${type}`, {
      method: 'get',
      headers: { accept: 'application/json' }
    }).then((response) => response.json())
  }

  prepareUpload (fileIDs) {
    return Promise.all(
      fileIDs.map((id) => this.getCredentials(id))
    ).then((credentials) => {
      const updatedFiles = {}
      fileIDs.forEach((id, index) => {
        const file = this.getFile(id)
        const { endpoint, params } = credentials[index]
        const updatedFile = Object.assign({}, file, {
          // TODO maybe move this into a parameter in the `multipart` object.
          // `meta` may contain other important data, but S3 will reject the request
          // if it contains any parameters it does not know.
          // Perhaps a `fieldsOverride` option in the Multipart plugin, idk.
          meta: params,
          multipart: {
            endpoint,
            fieldName: 'file',
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
    })
  }

  install () {
    this.core.addPreProcessor(this.prepareUpload)
  }

  uninstall () {
    this.core.removePreProcessor(this.prepareUpload)
  }
}
