const Plugin = require('../core/Plugin')

module.exports = class DeletrFiles extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'remover'
    this.id = 'DeletrFiles'
    this.title = 'DeletrFiles'

    // Default options
    const defaultOptions = {
      endpoint: '',
      method: 'DELETE',
      fieldName: 'fileId',
      headers: {}
    }

    // Merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)

    this.handleRemove = this.handleRemove.bind(this)
  }

  remove (fileId) {
    return new Promise((resolve, reject) => {
      const data = new FormData()
      data.append(this.opts.fieldName, fileId)

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('loadstart', (ev) => {
        this.uppy.log(`[DeleteFiles] ${fileId} request sent`)
      })

      xhr.addEventListener('load', (ev) => {
        this.uppy.log(`[DeleteFiles] ${fileId} response received`)

        if (ev.target.status >= 200 && ev.target.status < 300) {
          this.uppy.emit('remove-success', fileId)
          return resolve()
        } else {
          const error = new Error('Remove error')
          error.request = xhr
          this.uppy.emit('remove-error', fileId, error)
          return reject(error)
        }
      })

      xhr.addEventListener('error', (ev) => {
        this.uppy.log(`[DeleteFiles] ${fileId} got an error`)

        const error = new Error('Remove error')
        this.uppy.emit('remove-error', fileId, error)
        return reject(error)
      })

      xhr.open(this.opts.method.toUpperCase(), this.opts.endpoint, true)

      Object.keys(this.opts.headers).forEach((header) => {
        xhr.setRequestHeader(header, this.opts.headers[header])
      })

      xhr.send(data)
    })
  }

  handleRemove (fileId) {
    this.uppy.log(`[DeleteFiles] ${fileId} started`)

    return this.remove(fileId).then(() => {
      this.uppy.log(`[DeleteFiles] ${fileId} done`)
    }).catch(() => {
      this.uppy.log(`[DeleteFiles] ${fileId} crashed`)
    })
  }

  install () {
    this.uppy.addRemover(this.handleRemove)
  }

  uninstall () {
    this.uppy.removeRemover(this.handleRemove)
  }
}
