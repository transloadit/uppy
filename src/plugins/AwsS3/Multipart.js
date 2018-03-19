const Plugin = require('../../core/Plugin')
const { limitPromises } = require('../../core/Utils')
const Uploader = require('./MultipartUploader')

function handleResponse (response) {
  if (response.ok) return response.json()
  return response.json().then((err) => {
    throw err
  })
}

module.exports = class AwsS3Multipart extends Plugin {
  constructor (uppy, opts) {
    super(uppy, opts)
    this.type = 'uploader'
    this.id = 'AwsS3Multipart'
    this.title = 'AWS S3 Multipart'

    const defaultOptions = {
      timeout: 30 * 1000,
      limit: 0,
      createMultipartUpload: this.createMultipartUpload.bind(this),
      listParts: this.listParts.bind(this),
      prepareUploadPart: this.prepareUploadPart.bind(this),
      abortMultipartUpload: this.abortMultipartUpload.bind(this),
      completeMultipartUpload: this.completeMultipartUpload.bind(this)
    }

    this.opts = Object.assign({}, defaultOptions, opts)

    this.upload = this.upload.bind(this)

    if (typeof this.opts.limit === 'number' && this.opts.limit !== 0) {
      this.limitRequests = limitPromises(this.opts.limit)
    } else {
      this.limitRequests = (fn) => fn
    }
  }

  assertHost () {
    if (!this.opts.host) {
      throw new Error('Expected a `host` option containing an uppy-server address.')
    }
  }

  createMultipartUpload (file) {
    this.assertHost()

    const filename = encodeURIComponent(file.name)
    const type = encodeURIComponent(file.type)
    return fetch(`${this.opts.host}/s3/multipart?filename=${filename}&type=${type}`, {
      method: 'post',
      headers: { accept: 'application/json' }
    }).then(handleResponse)
  }

  listParts (file, { key, uploadId }) {
    this.assertHost()

    const filename = encodeURIComponent(key)
    return fetch(`${this.opts.host}/s3/multipart/${uploadId}?key=${filename}`, {
      method: 'get',
      headers: { accept: 'application/json' }
    }).then(handleResponse)
  }

  prepareUploadPart (file, { key, uploadId, number }) {
    this.assertHost()

    const filename = encodeURIComponent(key)
    return fetch(`${this.opts.host}/s3/multipart/${uploadId}/${number}?key=${filename}`, {
      method: 'get',
      headers: { accept: 'application/json' }
    }).then(handleResponse)
  }

  completeMultipartUpload (file, { key, uploadId, parts }) {
    this.assertHost()

    const filename = encodeURIComponent(key)
    const uploadIdEnc = encodeURIComponent(uploadId)
    return fetch(`${this.opts.host}/s3/multipart/${uploadIdEnc}/complete?key=${filename}`, {
      method: 'post',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ parts })
    }).then(handleResponse)
  }

  abortMultipartUpload (file, { key, uploadId }) {
    this.assertHost()

    const filename = encodeURIComponent(key)
    const uploadIdEnc = encodeURIComponent(uploadId)
    return fetch(`${this.opts.host}/s3/multipart/${uploadIdEnc}?key=${filename}`, {
      method: 'delete',
      headers: { accept: 'application/json' }
    }).then(handleResponse)
  }

  uploadFile (file) {
    return new Promise((resolve, reject) => {
      const upload = new Uploader(file.data, Object.assign({
        // .bind to pass the file object to each handler.
        createMultipartUpload: this.limitRequests(this.opts.createMultipartUpload.bind(this, file)),
        listParts: this.limitRequests(this.opts.listParts.bind(this, file)),
        prepareUploadPart: this.opts.prepareUploadPart.bind(this, file),
        completeMultipartUpload: this.limitRequests(this.opts.completeMultipartUpload.bind(this, file)),
        abortMultipartUpload: this.limitRequests(this.opts.abortMultipartUpload.bind(this, file)),

        limit: this.opts.limit || 5,
        onStart: (data) => {
          const cFile = this.uppy.getFile(file.id)
          this.uppy.setFileState(file.id, {
            s3Multipart: Object.assign({}, cFile.s3Multipart, {
              key: data.key,
              uploadId: data.uploadId,
              parts: []
            })
          })
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          this.uppy.emit('upload-progress', file, {
            uploader: this,
            bytesUploaded: bytesUploaded,
            bytesTotal: bytesTotal
          })
        },
        onError: (err) => {
          this.uppy.log(err)
          this.uppy.emit('upload-error', file, err)
          err.message = `Failed because: ${err.message}`
          reject(err)
        },
        onSuccess: (result) => {
          this.uppy.emit('upload-success', file, upload, result.location)

          if (result.location) {
            this.uppy.log('Download ' + upload.file.name + ' from ' + result.location)
          }

          resolve(upload)
        },
        onPartComplete: (part) => {
          // Store completed parts in state.
          const cFile = this.uppy.getFile(file.id)
          this.uppy.setFileState(file.id, {
            s3Multipart: Object.assign({}, cFile.s3Multipart, {
              parts: [
                ...cFile.s3Multipart.parts,
                part
              ]
            })
          })

          this.uppy.emit('s3-multipart:part-uploaded', cFile, part)
        }
      }, file.s3Multipart))

      this.uppy.on('file-removed', (removed) => {
        if (file.id !== removed.id) return
        upload.abort({ really: true })
        resolve(`upload ${removed.id} was removed`)
      })

      this.uppy.on('upload-pause', (pausee, isPaused) => {
        if (pausee.id !== file.id) return
        if (isPaused) {
          upload.pause()
        } else {
          upload.start()
        }
      })

      this.uppy.on('pause-all', () => {
        upload.pause()
      })

      this.uppy.on('cancel-all', () => {
        upload.abort({ really: true })
      })

      this.uppy.on('resume-all', () => {
        upload.start()
      })

      if (!file.isPaused) {
        upload.start()
      }

      if (!file.isRestored) {
        this.uppy.emit('upload-started', file, upload)
      }
    })
  }

  upload (fileIDs) {
    if (fileIDs.length === 0) return Promise.resolve()

    const promises = fileIDs.map((id) => {
      const file = this.uppy.getFile(id)
      if (file.isRemote) {
        return Promise.reject(new Error('AwsS3/Multipart: Remote file uploads are not currently supported.'))
      }
      return this.uploadFile(file)
    })

    return Promise.all(promises)
  }

  addResumableUploadsCapabilityFlag () {
    this.uppy.setState({
      capabilities: Object.assign({}, this.uppy.getState().capabilities, {
        resumableUploads: true
      })
    })
  }

  install () {
    this.addResumableUploadsCapabilityFlag()
    this.uppy.addUploader(this.upload)
  }

  uninstall () {
    this.uppy.removeUploader(this.upload)
  }
}
