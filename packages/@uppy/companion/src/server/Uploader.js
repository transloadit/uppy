const fs = require('fs')
const path = require('path')
const tus = require('tus-js-client')
const uuid = require('uuid')
const createTailReadStream = require('@uppy/fs-tail-stream')
const emitter = require('./emitter')
const request = require('request')
const serializeError = require('serialize-error')
const { jsonStringify, hasMatch } = require('./helpers/utils')
const logger = require('./logger')
const validator = require('validator')
const headerSanitize = require('./header-blacklist')

const PROTOCOLS = Object.freeze({
  multipart: 'multipart',
  s3Multipart: 's3-multipart',
  tus: 'tus'
})

class Uploader {
  /**
   * Uploads file to destination based on the supplied protocol (tus, s3-multipart, multipart)
   * For tus uploads, the deferredLength option is enabled, because file size value can be unreliable
   * for some providers (Instagram particularly)
   *
   * @typedef {object} UploaderOptions
   * @property {string} endpoint
   * @property {string=} uploadUrl
   * @property {string} protocol
   * @property {number} size
   * @property {string=} fieldname
   * @property {string} pathPrefix
   * @property {string=} path
   * @property {any=} s3
   * @property {any} metadata
   * @property {any} uppyOptions
   * @property {any=} storage
   * @property {any=} headers
   *
   * @param {UploaderOptions} options
   */
  constructor (options) {
    if (!this.validateOptions(options)) {
      logger.debug(this._errRespMessage, 'uploader.validator.fail')
      return
    }

    this.options = options
    this.token = uuid.v4()
    this.options.path = `${this.options.pathPrefix}/${Uploader.FILE_NAME_PREFIX}-${this.token}`
    this.streamsEnded = false
    this.duplexStream = null
    // @TODO disabling parallel uploads and downloads for now
    // if (this.options.protocol === PROTOCOLS.tus) {
    //   this.duplexStream = new stream.PassThrough()
    //     .on('error', (err) => logger.error(`${this.shortToken} ${err}`, 'uploader.duplex.error'))
    // }
    this.writeStream = fs.createWriteStream(this.options.path, { mode: 0o666 }) // no executable files
      .on('error', (err) => logger.error(`${this.shortToken} ${err}`, 'uploader.write.error'))
    /** @type {number} */
    this.emittedProgress = 0
    this.storage = options.storage
    this._paused = false

    if (this.options.protocol === PROTOCOLS.tus) {
      emitter().on(`pause:${this.token}`, () => {
        this._paused = true
        if (this.tus) {
          this.tus.abort()
        }
      })

      emitter().on(`resume:${this.token}`, () => {
        this._paused = false
        if (this.tus) {
          this.tus.start()
        }
      })
    }
  }

  /**
   * the number of bytes written into the streams
   */
  get bytesWritten () {
    return this.writeStream.bytesWritten
  }

  /**
   * Validate the options passed down to the uplaoder
   *
   * @param {UploaderOptions} options
   * @returns {boolean}
   */
  validateOptions (options) {
    // s3 uploads don't require upload destination
    // validation, because the destination is determined
    // by the server's s3 config
    if (options.protocol === PROTOCOLS.s3Multipart) {
      return true
    }

    if (!options.endpoint && !options.uploadUrl) {
      this._errRespMessage = 'No destination specified'
      return false
    }

    const validatorOpts = { require_protocol: true, require_tld: !options.uppyOptions.debug }
    return [options.endpoint, options.uploadUrl].every((url) => {
      if (url && !validator.isURL(url, validatorOpts)) {
        this._errRespMessage = 'Invalid destination url'
        return false
      }

      const allowedUrls = options.uppyOptions.uploadUrls
      if (allowedUrls && url && !hasMatch(url, allowedUrls)) {
        this._errRespMessage = 'upload destination does not match any allowed destinations'
        return false
      }

      return true
    })
  }

  hasError () {
    return this._errRespMessage != null
  }

  /**
   * returns a substring of the token
   */
  get shortToken () {
    return this.token.substring(0, 8)
  }

  /**
   *
   * @param {function} callback
   */
  onSocketReady (callback) {
    emitter().once(`connection:${this.token}`, () => callback())
    logger.debug(`${this.shortToken} waiting for connection`, 'uploader.socket.wait')
  }

  cleanUp () {
    fs.unlink(this.options.path, (err) => {
      if (err) {
        logger.error(`cleanup failed for: ${this.options.path} err: ${err}`, 'uploader.cleanup.error')
      }
    })
    emitter().removeAllListeners(`pause:${this.token}`)
    emitter().removeAllListeners(`resume:${this.token}`)
  }

  /**
   *
   * @param {Buffer | Buffer[]} chunk
   */
  handleChunk (chunk) {
    // @todo a default protocol should not be set. We should ensure that the user specifies her protocol.
    const protocol = this.options.protocol || PROTOCOLS.multipart

    // The download has completed; close the file and start an upload if necessary.
    if (chunk === null) {
      this.writeStream.on('finish', () => {
        this.streamsEnded = true
        if (this.options.endpoint && protocol === PROTOCOLS.multipart) {
          this.uploadMultipart()
        }

        if (protocol === PROTOCOLS.tus && !this.tus) {
          return this.uploadTus()
        }
      })

      return this.endStreams()
    }

    this.writeStream.write(chunk, () => {
      logger.debug(`${this.shortToken} ${this.bytesWritten} bytes`, 'uploader.download.progress')
      if (protocol === PROTOCOLS.multipart || protocol === PROTOCOLS.tus) {
        return this.emitIllusiveProgress()
      }

      if (protocol === PROTOCOLS.s3Multipart && !this.s3Upload) {
        return this.uploadS3()
      }
      // @TODO disabling parallel uploads and downloads for now
      // if (!this.options.endpoint) return

      // if (protocol === PROTOCOLS.tus && !this.tus) {
      //   return this.uploadTus()
      // }
    })
  }

  /**
   * @param {Buffer | Buffer[]} chunk
   * @param {function} cb
   */
  writeToStreams (chunk, cb) {
    const done = []
    const doneLength = this.duplexStream ? 2 : 1
    const onDone = () => {
      done.push(true)
      if (done.length >= doneLength) {
        cb()
      }
    }

    this.writeStream.write(chunk, onDone)
    if (this.duplexStream) {
      this.duplexStream.write(chunk, onDone)
    }
  }

  endStreams () {
    this.writeStream.end()
    if (this.duplexStream) {
      this.duplexStream.end()
    }
  }

  getResponse () {
    if (this._errRespMessage) {
      return { body: this._errRespMessage, status: 400 }
    }
    return { body: { token: this.token }, status: 200 }
  }

  /**
   * @typedef {{action: string, payload: object}} State
   * @param {State} state
   */
  saveState (state) {
    if (!this.storage) return
    this.storage.set(`${Uploader.STORAGE_PREFIX}:${this.token}`, jsonStringify(state))
  }

  /**
   * This method emits upload progress but also creates an "upload progress" illusion
   * for the waiting period while only download is happening. Hence, it combines both
   * download and upload into an upload progress.
   * @see emitProgress
   * @param {number=} bytesUploaded the bytes actually Uploaded so far
   */
  emitIllusiveProgress (bytesUploaded) {
    if (this._paused) {
      return
    }

    let bytesTotal = this.streamsEnded ? this.bytesWritten : this.options.size
    if (!this.streamsEnded) {
      bytesTotal = Math.max(bytesTotal, this.bytesWritten)
    }
    bytesUploaded = bytesUploaded || 0
    // for a 10MB file, 10MB of download will account for 5MB upload progress
    // and 10MB of actual upload will account for the other 5MB upload progress.
    const illusiveBytesUploaded = (this.bytesWritten / 2) + (bytesUploaded / 2)

    logger.debug(
      `${this.shortToken} ${bytesUploaded} ${illusiveBytesUploaded} ${bytesTotal}`,
      'uploader.illusive.progress'
    )
    this.emitProgress(illusiveBytesUploaded, bytesTotal)
  }

  /**
   *
   * @param {number} bytesUploaded
   * @param {number | null} bytesTotal
   */
  emitProgress (bytesUploaded, bytesTotal) {
    bytesTotal = bytesTotal || this.options.size
    if (this.tus && this.tus.options.uploadLengthDeferred && this.streamsEnded) {
      bytesTotal = this.bytesWritten
    }
    const percentage = (bytesUploaded / bytesTotal * 100)
    const formatPercentage = percentage.toFixed(2)
    logger.debug(
      `${this.shortToken} ${bytesUploaded} ${bytesTotal} ${formatPercentage}%`,
      'uploader.upload.progress'
    )

    const dataToEmit = {
      action: 'progress',
      payload: { progress: formatPercentage, bytesUploaded, bytesTotal }
    }
    this.saveState(dataToEmit)

    // avoid flooding the client with progress events.
    const roundedPercentage = Math.floor(percentage)
    if (this.emittedProgress !== roundedPercentage) {
      this.emittedProgress = roundedPercentage
      emitter().emit(this.token, dataToEmit)
    }
  }

  /**
   *
   * @param {string} url
   * @param {object} extraData
   */
  emitSuccess (url, extraData = {}) {
    const emitData = {
      action: 'success',
      payload: Object.assign(extraData, { complete: true, url })
    }
    this.saveState(emitData)
    emitter().emit(this.token, emitData)
  }

  /**
   *
   * @param {Error} err
   * @param {object=} extraData
   */
  emitError (err, extraData = {}) {
    const dataToEmit = {
      action: 'error',
      // TODO: consider removing the stack property
      payload: Object.assign(extraData, { error: serializeError(err) })
    }
    this.saveState(dataToEmit)
    emitter().emit(this.token, dataToEmit)
  }

  /**
   * start the tus upload
   */
  uploadTus () {
    const fname = path.basename(this.options.path)
    const ftype = this.options.metadata.type
    const metadata = Object.assign({ filename: fname, filetype: ftype }, this.options.metadata || {})
    const file = fs.createReadStream(this.options.path)
    const uploader = this

    // @ts-ignore
    this.tus = new tus.Upload(file, {
      endpoint: this.options.endpoint,
      uploadUrl: this.options.uploadUrl,
      // @ts-ignore
      uploadLengthDeferred: false,
      resume: true,
      retryDelays: [0, 1000, 3000, 5000],
      uploadSize: this.bytesWritten,
      metadata,
      /**
       *
       * @param {Error} error
       */
      onError (error) {
        logger.error(error, 'uploader.tus.error')
        uploader.emitError(error)
      },
      /**
       *
       * @param {number} bytesUploaded
       * @param {number} bytesTotal
       */
      onProgress (bytesUploaded, bytesTotal) {
        uploader.emitIllusiveProgress(bytesUploaded)
      },
      onSuccess () {
        uploader.emitSuccess(uploader.tus.url)
        uploader.cleanUp()
      }
    })

    if (!this._paused) {
      this.tus.start()
    }
  }

  uploadMultipart () {
    const file = fs.createReadStream(this.options.path)

    // upload progress
    let bytesUploaded = 0
    file.on('data', (data) => {
      bytesUploaded += data.length
      this.emitIllusiveProgress(bytesUploaded)
    })

    const formData = Object.assign(
      {},
      this.options.metadata,
      { [this.options.fieldname]: file }
    )
    const headers = headerSanitize(this.options.headers)
    request.post({ url: this.options.endpoint, headers, formData, encoding: null }, (error, response, body) => {
      if (error) {
        logger.error(error, 'upload.multipart.error')
        this.emitError(error)
        return
      }
      const headers = response.headers
      // remove browser forbidden headers
      delete headers['set-cookie']
      delete headers['set-cookie2']

      const respObj = {
        responseText: body.toString(),
        status: response.statusCode,
        statusText: response.statusMessage,
        headers
      }

      if (response.statusCode >= 400) {
        logger.error(`upload failed with status: ${response.statusCode}`, 'upload.multipart.error')
        this.emitError(new Error(response.statusMessage), respObj)
      } else if (bytesUploaded !== this.bytesWritten && bytesUploaded !== this.options.size) {
        const errMsg = `uploaded only ${bytesUploaded} of ${this.bytesWritten} with status: ${response.statusCode}`
        logger.error(errMsg, 'upload.multipart.mismatch.error')
        this.emitError(new Error(errMsg))
      } else {
        this.emitSuccess(null, { response: respObj })
      }

      this.cleanUp()
    })
  }

  /**
   * Upload the file to S3 while it is still being downloaded.
   */
  uploadS3 () {
    const file = createTailReadStream(this.options.path, {
      tail: true
    })

    this.writeStream.on('finish', () => {
      file.close()
    })

    return this._uploadS3(file)
  }

  /**
   * Upload a stream to S3.
   */
  _uploadS3 (stream) {
    if (!this.options.s3) {
      this.emitError(new Error('The S3 client is not configured on this companion instance.'))
      return
    }

    const filename = this.options.metadata.filename || path.basename(this.options.path)
    const { client, options } = this.options.s3

    const upload = client.upload({
      Bucket: options.bucket,
      Key: options.getKey(null, filename),
      ACL: options.acl,
      ContentType: this.options.metadata.type,
      Body: stream
    })

    this.s3Upload = upload

    upload.on('httpUploadProgress', ({ loaded, total }) => {
      this.emitProgress(loaded, total)
    })

    upload.send((error, data) => {
      this.s3Upload = null
      if (error) {
        this.emitError(error)
      } else {
        this.emitSuccess(null, {
          response: {
            responseText: JSON.stringify(data),
            headers: {
              'content-type': 'application/json'
            }
          }
        })
      }
      this.cleanUp()
    })
  }
}

Uploader.FILE_NAME_PREFIX = 'uppy-file'
Uploader.STORAGE_PREFIX = 'companion'

module.exports = Uploader
