const Plugin = require('../../core/Plugin')
const Translator = require('../../core/Translator')
const { limitPromises } = require('../../core/Utils')

const MB = 1024 * 1024

module.exports = class AwsS3Multipart extends Plugin {
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
      createMultipartUpload: this.createMultipartUpload.bind(this),
      prepareUploadPart: this.prepareUploadPart.bind(this),
      abortMultipartUpload: this.abortMultipartUpload.bind(this),
      completeMultipartUpload: this.completeMultipartUpload.bind(this),
      locale: defaultLocale
    }

    this.opts = Object.assign({}, defaultOptions, opts)
    this.locale = Object.assign({}, defaultLocale, this.opts.locale)
    this.locale.strings = Object.assign({}, defaultLocale.strings, this.opts.locale.strings)

    this.translator = new Translator({ locale: this.locale })
    this.i18n = this.translator.translate.bind(this.translator)

    this.prepareUpload = this.prepareUpload.bind(this)
    this.upload = this.upload.bind(this)

    if (typeof this.opts.limit === 'number' && this.opts.limit !== 0) {
      this.limitRequests = limitPromises(this.opts.limit)
    } else {
      this.limitRequests = (fn) => fn
    }
  }

  splitFile (file) {
    const chunks = []
    const chunkSize = Math.max(Math.ceil(file.size / 10000), 5 * MB)

    for (let i = 0; i < file.size; i += chunkSize) {
      const end = Math.min(file.size, i + chunkSize)
      chunks.push(file.slice(i, end))
    }

    return chunks
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
    }).then((response) => response.json())
  }

  prepareUploadPart (file, { key, uploadId, number }) {
    this.assertHost()

    const filename = encodeURIComponent(key)
    return fetch(`${this.opts.host}/s3/multipart/${uploadId}/${number}?key=${filename}`, {
      method: 'get',
      headers: { accept: 'application/json' }
    }).then((response) => response.json())
  }

  uploadPart (url, body, onProgress) {
    this.uppy.log(`Uploading a chunk of ${body.size} bytes to ${url}`)
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest()
      xhr.open('PUT', url, true)

      xhr.upload.addEventListener('progress', (ev) => {
        if (!ev.lengthComputable) return

        onProgress(ev.loaded, ev.total)
      })

      xhr.addEventListener('load', (ev) => {
        if (ev.target.status < 200 || ev.target.status >= 300) {
          reject(new Error('Non 2xx'))
          return
        }

        onProgress(body.size)

        // NOTE This must be allowed by CORS.
        const etag = ev.target.getResponseHeader('ETag')
        resolve({ etag })
      })

      xhr.addEventListener('error', (ev) => {
        const error = new Error('Unknown error')
        error.source = ev.target
        reject(error)
      })

      xhr.send(body)
    })
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
    }).then((response) => response.json())
  }

  abortMultipartUpload (file, { key, uploadId }) {
    this.assertHost()

    const filename = encodeURIComponent(key)
    const uploadIdEnc = encodeURIComponent(uploadId)
    return fetch(`${this.opts.host}/s3/multipart/${uploadIdEnc}?key=${filename}`, {
      method: 'delete',
      headers: { accept: 'application/json' }
    }).then((response) => response.json())
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

    const createMultipartUpload = this.limitRequests(this.opts.createMultipartUpload)

    return Promise.all(
      fileIDs.map((id) => {
        const file = this.uppy.getFile(id)
        const createPromise = Promise.resolve()
          .then(() => createMultipartUpload(file))
        return createPromise.then((result) => {
          const valid = typeof result === 'object' && result &&
            typeof result.uploadId === 'string' &&
            typeof result.key === 'string'
          if (!valid) {
            throw new TypeError(`AwsS3/Multipart: Got incorrect result from 'createMultipartUpload()' for file '${file.name}', expected an object '{ uploadId, key }'.`)
          }
          return result
        }).then((result) => {
          this.uppy.emit('preprocess-progress', file, {
            mode: 'determinate',
            message: this.i18n('preparingUpload'),
            value: 1
          })

          this.uppy.setFileState(file.id, {
            s3Multipart: result
          })
          this.uppy.emit('preprocess-complete', file)

          return result
        }).catch((error) => {
          this.uppy.emit('upload-error', file, error)
          throw error
        })
      })
    )
  }

  uploadFile (file) {
    const chunks = this.splitFile(file.data)

    const completeMultipartUpload = this.limitRequests(this.opts.completeMultipartUpload)

    this.uppy.emit('upload-started', file)

    const total = file.size
    // Keep track of progress for chunks individually, so it's easy to reset progress if one of them fails.
    const currentProgress = chunks.map(() => 0)

    const doUploadPart = (chunk, index) => {
      return Promise.resolve(
        this.opts.prepareUploadPart(file, {
          key: file.s3Multipart.key,
          uploadId: file.s3Multipart.uploadId,
          body: chunk,
          number: index + 1
        })
      ).then((result) => {
        const valid = typeof result === 'object' && result &&
          typeof result.url === 'string'
        if (!valid) {
          throw new TypeError(`AwsS3/Multipart: Got incorrect result from 'prepareUploadPart()' for file '${file.name}', expected an object '{ url }'.`)
        }
        return result
      }).then(({ url }) => {
        return this.uploadPart(url, chunk, (current) => {
          currentProgress[index] = current

          this.uppy.emit('upload-progress', this.uppy.getFile(file.id), {
            uploader: this,
            bytesUploaded: currentProgress.reduce((a, b) => a + b),
            bytesTotal: total
          })
        }).then(({ etag }) => ({
          ETag: etag,
          PartNumber: index + 1
        }))
      })
    }

    // Limit this bundle of Prepare + Upload request instead of the individual requests;
    // otherwise there might be too much time between Prepare and Upload (> 5 minutes).
    const uploadPart = this.limitRequests(doUploadPart)

    const partUploads = chunks.map((chunk, index) => {
      return uploadPart(chunk, index)
    })

    return Promise.all(partUploads).then((parts) => {
      return completeMultipartUpload(file, {
        key: file.s3Multipart.key,
        uploadId: file.s3Multipart.uploadId,
        parts
      })
    }).then(() => {
      this.uppy.emit('upload-success', this.uppy.getFile(file.id))
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

  install () {
    this.uppy.addPreProcessor(this.prepareUpload)
    this.uppy.addUploader(this.upload)
  }

  uninstall () {
    this.uppy.removeUploader(this.upload)
    this.uppy.removePreProcessor(this.prepareUpload)
  }
}
