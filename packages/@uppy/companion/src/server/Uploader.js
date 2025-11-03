import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { createReadStream, createWriteStream, ReadStream } from 'node:fs'
import { stat, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Upload } from '@aws-sdk/lib-storage'
import { FormData } from 'formdata-node'
import got from 'got'
import throttle from 'lodash/throttle.js'
import { serializeError } from 'serialize-error'
import tus from 'tus-js-client'
import validator from 'validator'
import emitter from './emitter/index.js'
import headerSanitize from './header-blacklist.js'
import {
  getBucket,
  hasMatch,
  jsonStringify,
  rfc2047EncodeMetadata,
  truncateFilename,
} from './helpers/utils.js'
import * as logger from './logger.js'
import * as redis from './redis.js'

// Need to limit length or we can get
// "MetadataTooLarge: Your metadata headers exceed the maximum allowed metadata size" in tus / S3
const DEFAULT_FIELD_NAME = 'files[]'
const PROTOCOLS = Object.freeze({
  multipart: 'multipart',
  s3Multipart: 's3-multipart',
  tus: 'tus',
})

function exceedsMaxFileSize(maxFileSize, size) {
  return maxFileSize && size && size > maxFileSize
}

export class ValidationError extends Error {
  name = 'ValidationError'
}

/**
 * Validate the options passed down to the uplaoder
 *
 * @param {UploaderOptions} options
 */
function validateOptions(options) {
  // validate HTTP Method
  if (options.httpMethod) {
    if (typeof options.httpMethod !== 'string') {
      throw new ValidationError('unsupported HTTP METHOD specified')
    }

    const method = options.httpMethod.toUpperCase()
    if (method !== 'PUT' && method !== 'POST') {
      throw new ValidationError('unsupported HTTP METHOD specified')
    }
  }

  if (exceedsMaxFileSize(options.companionOptions.maxFileSize, options.size)) {
    throw new ValidationError('maxFileSize exceeded')
  }

  // validate fieldname
  if (options.fieldname != null && typeof options.fieldname !== 'string') {
    throw new ValidationError('fieldname must be a string')
  }

  // validate metadata
  if (options.metadata != null && typeof options.metadata !== 'object') {
    throw new ValidationError('metadata must be an object')
  }

  // validate headers
  if (options.headers != null && typeof options.headers !== 'object') {
    throw new ValidationError('headers must be an object')
  }

  // validate protocol
  if (
    options.protocol &&
    !Object.keys(PROTOCOLS).some((key) => PROTOCOLS[key] === options.protocol)
  ) {
    throw new ValidationError('unsupported protocol specified')
  }

  // s3 uploads don't require upload destination
  // validation, because the destination is determined
  // by the server's s3 config
  if (options.protocol !== PROTOCOLS.s3Multipart) {
    if (!options.endpoint && !options.uploadUrl) {
      throw new ValidationError('no destination specified')
    }

    const validateUrl = (url) => {
      const validatorOpts = { require_protocol: true, require_tld: false }
      if (url && !validator.isURL(url, validatorOpts)) {
        throw new ValidationError('invalid destination url')
      }

      const allowedUrls = options.companionOptions.uploadUrls
      if (allowedUrls && url && !hasMatch(url, allowedUrls)) {
        throw new ValidationError(
          'upload destination does not match any allowed destinations',
        )
      }
    }

    ;[options.endpoint, options.uploadUrl].forEach(validateUrl)
  }

  if (options.chunkSize != null && typeof options.chunkSize !== 'number') {
    throw new ValidationError('incorrect chunkSize')
  }
}

const states = {
  idle: 'idle',
  uploading: 'uploading',
  paused: 'paused',
  done: 'done',
}

export default class Uploader {
  /** @type {import('ioredis').Redis} */
  storage

  /**
   * Uploads file to destination based on the supplied protocol (tus, s3-multipart, multipart)
   * For tus uploads, the deferredLength option is enabled, because file size value can be unreliable
   * for some providers (Instagram particularly)
   *
   * @typedef {object} UploaderOptions
   * @property {string} endpoint
   * @property {string} [uploadUrl]
   * @property {string} protocol
   * @property {number} [size]
   * @property {string} [fieldname]
   * @property {string} pathPrefix
   * @property {any} [s3]
   * @property {any} metadata
   * @property {any} companionOptions
   * @property {any} [storage]
   * @property {any} [headers]
   * @property {string} [httpMethod]
   * @property {boolean} [useFormData]
   * @property {number} [chunkSize]
   * @property {string} [providerName]
   *
   * @param {UploaderOptions} optionsIn
   */
  constructor(optionsIn) {
    validateOptions(optionsIn)

    const options = {
      ...optionsIn,
      headers: {
        ...optionsIn.headers,
        ...optionsIn.companionOptions.uploadHeaders,
      },
    }

    this.providerName = options.providerName
    this.options = options
    this.token = randomUUID()
    this.fileName = `${Uploader.FILE_NAME_PREFIX}-${this.token}`
    this.options.metadata = {
      ...(this.providerName != null && { provider: this.providerName }),
      ...(this.options.metadata || {}), // allow user to override provider
    }
    this.options.fieldname = this.options.fieldname || DEFAULT_FIELD_NAME
    this.size = options.size
    const { maxFilenameLength } = this.options.companionOptions

    // Define upload file name
    this.uploadFileName = truncateFilename(
      this.options.metadata.name || this.fileName,
      maxFilenameLength,
    )

    this.storage = options.storage

    this.downloadedBytes = 0

    this.readStream = null

    if (this.options.protocol === PROTOCOLS.tus) {
      emitter().on(`pause:${this.token}`, () => {
        logger.debug('Received from client: pause', 'uploader', this.shortToken)
        if (this.#uploadState !== states.uploading) return
        this.#uploadState = states.paused
        if (this.tus) {
          this.tus.abort()
        }
      })

      emitter().on(`resume:${this.token}`, () => {
        logger.debug(
          'Received from client: resume',
          'uploader',
          this.shortToken,
        )
        if (this.#uploadState !== states.paused) return
        this.#uploadState = states.uploading
        if (this.tus) {
          this.tus.start()
        }
      })
    }

    emitter().on(`cancel:${this.token}`, () => {
      logger.debug('Received from client: cancel', 'uploader', this.shortToken)
      if (this.tus) {
        const shouldTerminate = !!this.tus.url
        this.tus.abort(shouldTerminate).catch(() => {})
      }
      this.#canceled = true
      this.abortReadStream(new Error('Canceled'))
    })
  }

  #uploadState = states.idle

  #canceled = false

  abortReadStream(err) {
    this.#uploadState = states.done
    if (this.readStream) this.readStream.destroy(err)
  }

  _getUploadProtocol() {
    return this.options.protocol || PROTOCOLS.multipart
  }

  async _uploadByProtocol(req) {
    const protocol = this._getUploadProtocol()

    switch (protocol) {
      case PROTOCOLS.multipart:
        return this.#uploadMultipart(this.readStream)
      case PROTOCOLS.s3Multipart:
        return this.#uploadS3Multipart(this.readStream, req)
      case PROTOCOLS.tus:
        return this.#uploadTus(this.readStream)
      default:
        throw new Error('Invalid protocol')
    }
  }

  async _downloadStreamAsFile(stream) {
    this.tmpPath = join(this.options.pathPrefix, this.fileName)

    logger.debug('fully downloading file', 'uploader.download', this.shortToken)
    const writeStream = createWriteStream(this.tmpPath)

    const onData = (chunk) => {
      this.downloadedBytes += chunk.length
      if (
        exceedsMaxFileSize(
          this.options.companionOptions.maxFileSize,
          this.downloadedBytes,
        )
      ) {
        this.abortReadStream(new Error('maxFileSize exceeded'))
      }
      this.onProgress(0, undefined)
    }

    stream.on('data', onData)

    await pipeline(stream, writeStream)
    logger.debug(
      'finished fully downloading file',
      'uploader.download',
      this.shortToken,
    )

    const { size } = await stat(this.tmpPath)

    this.size = size

    const fileStream = createReadStream(this.tmpPath)
    this.readStream = fileStream
  }

  _canStream() {
    return this.options.companionOptions.streamingUpload
  }

  /**
   *
   * @param {import('stream').Readable} stream
   * @param {import('express').Request} req
   */
  async uploadStream(stream, req) {
    try {
      if (this.#uploadState !== states.idle)
        throw new Error('Can only start an upload in the idle state')
      if (this.readStream) throw new Error('Already uploading')

      this.#uploadState = states.uploading

      this.readStream = stream

      if (!this._canStream()) {
        logger.debug(
          'need to download the whole file first',
          'controller.get.provider.size',
          this.shortToken,
        )
        // Some streams need to be downloaded entirely first, because we don't know their size from the provider
        // This is true for zoom and drive (exported files) or some URL downloads.
        // The stream will then typically come from a "Transfer-Encoding: chunked" response
        await this._downloadStreamAsFile(this.readStream)
      }
      if (this.#uploadState !== states.uploading) return undefined

      const { url, extraData } = await Promise.race([
        this._uploadByProtocol(req),
        // If we don't handle stream errors, we get unhandled error in node.
        new Promise((resolve, reject) => this.readStream.on('error', reject)),
      ])
      return { url, extraData }
    } finally {
      this.#uploadState = states.done
      logger.debug('cleanup', this.shortToken)
      if (this.readStream && !this.readStream.destroyed)
        this.readStream.destroy()
      await this.tryDeleteTmpPath()
    }
  }

  tryDeleteTmpPath() {
    if (this.tmpPath) unlink(this.tmpPath).catch(() => {})
  }

  /**
   *
   * @param {import('stream').Readable} stream
   * @param {import('express').Request} req
   */
  async tryUploadStream(stream, req) {
    try {
      emitter().emit('upload-start', { token: this.token })

      const ret = await this.uploadStream(stream, req)
      if (!ret) return
      const { url, extraData } = ret
      this.#emitSuccess(url, extraData)
    } catch (err) {
      if (this.#canceled) {
        logger.error('Aborted upload', 'uploader.aborted', this.shortToken)
        return
      }
      logger.error(err, 'uploader.error', this.shortToken)
      await this.#emitError(err)
    } finally {
      emitter().removeAllListeners(`pause:${this.token}`)
      emitter().removeAllListeners(`resume:${this.token}`)
      emitter().removeAllListeners(`cancel:${this.token}`)
    }
  }

  /**
   * returns a substring of the token. Used as traceId for logging
   * we avoid using the entire token because this is meant to be a short term
   * access token between uppy client and companion websocket
   *
   * @param {string} token the token to Shorten
   * @returns {string}
   */
  static shortenToken(token) {
    return token.substring(0, 8)
  }

  static reqToOptions(req, size) {
    const useFormDataIsSet = Object.hasOwn(req.body, 'useFormData')
    const useFormData = useFormDataIsSet ? req.body.useFormData : true

    return {
      // Client provided info (must be validated and not blindly trusted):
      headers: req.body.headers,
      httpMethod: req.body.httpMethod,
      protocol: req.body.protocol,
      endpoint: req.body.endpoint,
      uploadUrl: req.body.uploadUrl,
      metadata: req.body.metadata,
      fieldname: req.body.fieldname,
      useFormData,

      providerName: req.companion.providerName,

      // Info coming from companion server configuration:
      size,
      companionOptions: req.companion.options,
      pathPrefix: `${req.companion.options.filePath}`,
      storage: redis.client(),
      s3: req.companion.s3Client
        ? {
            client: req.companion.s3Client,
            options: req.companion.options.s3,
          }
        : null,
      chunkSize: req.companion.options.chunkSize,
    }
  }

  /**
   * returns a substring of the token. Used as traceId for logging
   * we avoid using the entire token because this is meant to be a short term
   * access token between uppy client and companion websocket
   */
  get shortToken() {
    return Uploader.shortenToken(this.token)
  }

  async awaitReady(timeout) {
    logger.debug(
      'waiting for socket connection',
      'uploader.socket.wait',
      this.shortToken,
    )

    const eventName = `connection:${this.token}`
    await once(
      emitter(),
      eventName,
      timeout && { signal: AbortSignal.timeout(timeout) },
    )

    logger.debug(
      'socket connection received',
      'uploader.socket.wait',
      this.shortToken,
    )
  }

  /**
   * @typedef {{action: string, payload: object}} State
   * @param {State} state
   */
  saveState(state) {
    if (!this.storage) return
    // make sure the keys get cleaned up.
    // https://github.com/transloadit/uppy/issues/3748
    const keyExpirySec = 60 * 60 * 24
    const redisKey = `${Uploader.STORAGE_PREFIX}:${this.token}`
    this.storage.set(redisKey, jsonStringify(state), 'EX', keyExpirySec)
  }

  throttledEmitProgress = throttle(
    (dataToEmit) => {
      const { bytesUploaded, bytesTotal, progress } = dataToEmit.payload
      logger.debug(
        `${bytesUploaded} ${bytesTotal} ${progress}%`,
        'uploader.total.progress',
        this.shortToken,
      )
      this.saveState(dataToEmit)
      emitter().emit(this.token, dataToEmit)
    },
    1000,
    { trailing: false },
  )

  /**
   *
   * @param {number} [bytesUploaded]
   * @param {number | null} [bytesTotalIn]
   */
  onProgress(bytesUploaded = 0, bytesTotalIn = 0) {
    const bytesTotal = bytesTotalIn || this.size || 0

    // If fully downloading before uploading, combine downloaded and uploaded bytes
    // This will make sure that the user sees half of the progress before upload starts (while downloading)
    let combinedBytes = bytesUploaded
    if (!this._canStream()) {
      combinedBytes = Math.floor(
        (combinedBytes + (this.downloadedBytes || 0)) / 2,
      )
    }

    // Prevent divide by zero
    let percentage = 0
    if (bytesTotal > 0)
      percentage = Math.min(
        Math.max(0, (combinedBytes / bytesTotal) * 100),
        100,
      )

    const formattedPercentage = percentage.toFixed(2)

    if (this.#uploadState !== states.uploading) {
      return
    }

    const payload = {
      progress: formattedPercentage,
      bytesUploaded: combinedBytes,
      bytesTotal,
    }
    const dataToEmit = {
      action: 'progress',
      payload,
    }

    // avoid flooding the client (and log) with progress events.
    // flooding will cause reduced performance and possibly network issues
    this.throttledEmitProgress(dataToEmit)
  }

  /**
   *
   * @param {string} url
   * @param {object} extraData
   */
  #emitSuccess(url, extraData) {
    const emitData = {
      action: 'success',
      payload: { ...extraData, complete: true, url },
    }
    this.saveState(emitData)
    emitter().emit(this.token, emitData)
  }

  /**
   *
   * @param {Error} err
   */
  async #emitError(err) {
    // delete stack to avoid sending server info to client
    // see PR discussion https://github.com/transloadit/uppy/pull/3832
    const { stack, ...serializedErr } = serializeError(err)
    const dataToEmit = {
      action: 'error',
      payload: { error: serializedErr },
    }
    this.saveState(dataToEmit)
    emitter().emit(this.token, dataToEmit)
  }

  /**
   * start the tus upload
   *
   * @param {any} stream
   */
  async #uploadTus(stream) {
    const uploader = this

    const isFileStream = stream instanceof ReadStream
    // chunkSize needs to be a finite value if the stream is not a file stream (fs.createReadStream)
    // https://github.com/tus/tus-js-client/blob/4479b78032937ac14da9b0542e489ac6fe7e0bc7/lib/node/fileReader.js#L50
    const chunkSize = this.options.chunkSize || (isFileStream ? Infinity : 50e6)

    const tusRet = await new Promise((resolve, reject) => {
      const tusOptions = {
        endpoint: this.options.endpoint,
        uploadUrl: this.options.uploadUrl,
        retryDelays: [0, 1000, 3000, 5000],
        chunkSize,
        headers: headerSanitize(this.options.headers),
        addRequestId: true,
        metadata: {
          // file name and type as required by the tusd tus server
          // https://github.com/tus/tusd/blob/5b376141903c1fd64480c06dde3dfe61d191e53d/unrouted_handler.go#L614-L646
          filename: this.uploadFileName,
          filetype: this.options.metadata.type,
          ...this.options.metadata,
        },
        /**
         *
         * @param {Error} error
         */
        onError(error) {
          logger.error(error, 'uploader.tus.error')
          // deleting tus originalRequest field because it uses the same http-agent
          // as companion, and this agent may contain sensitive request details (e.g headers)
          // previously made to providers. Deleting the field would prevent it from getting leaked
          // to the frontend etc.
          // @ts-ignore
          delete error.originalRequest
          // @ts-ignore
          delete error.originalResponse
          reject(error)
        },
        /**
         *
         * @param {number} [bytesUploaded]
         * @param {number} [bytesTotal]
         */
        onProgress(bytesUploaded, bytesTotal) {
          uploader.onProgress(bytesUploaded, bytesTotal)
        },
        onSuccess() {
          resolve({ url: uploader.tus.url })
        },
      }

      if (
        this.options.companionOptions.tusDeferredUploadLength &&
        !isFileStream
      ) {
        tusOptions.uploadLengthDeferred = true
      } else {
        if (!this.size) {
          reject(
            new Error(
              'tusDeferredUploadLength needs to be enabled if no file size is provided by the provider',
            ),
          )
        }
        tusOptions.uploadLengthDeferred = false
        tusOptions.uploadSize = this.size
      }

      this.tus = new tus.Upload(stream, tusOptions)

      this.tus.start()
    })

    // @ts-ignore
    if (this.size != null && this.tus._size !== this.size) {
      // @ts-ignore
      logger.warn(
        // @ts-expect-error _size is not typed
        `Tus uploaded size ${this.tus._size} different from reported URL size ${this.size}`,
        'upload.tus.mismatch.error',
      )
    }

    return tusRet
  }

  async #uploadMultipart(stream) {
    if (!this.options.endpoint) {
      throw new Error('No multipart endpoint set')
    }

    function getRespObj(response) {
      // remove browser forbidden headers
      const {
        'set-cookie': deleted,
        'set-cookie2': deleted2,
        ...responseHeaders
      } = response.headers

      return {
        responseText: response.body,
        status: response.statusCode,
        statusText: response.statusMessage,
        headers: responseHeaders,
      }
    }

    // upload progress
    let bytesUploaded = 0
    stream.on('data', (data) => {
      bytesUploaded += data.length
      this.onProgress(bytesUploaded, undefined)
    })

    const url = this.options.endpoint
    const reqOptions = {
      headers: headerSanitize(this.options.headers),
    }

    if (this.options.useFormData) {
      const formData = new FormData()

      Object.entries(this.options.metadata).forEach(([key, value]) =>
        formData.append(key, value),
      )

      // see https://github.com/octet-stream/form-data/blob/73a5a24e635938026538673f94cbae1249a3f5cc/readme.md?plain=1#L232
      formData.set(this.options.fieldname, {
        name: this.uploadFileName,
        [Symbol.toStringTag]: 'File',
        stream() {
          return stream
        },
      })

      reqOptions.body = formData
    } else {
      reqOptions.headers['content-length'] = this.size
      reqOptions.body = stream
    }

    try {
      const httpMethod =
        (this.options.httpMethod || '').toUpperCase() === 'PUT' ? 'put' : 'post'
      const runRequest = got[httpMethod]

      const response = await runRequest(url, reqOptions)

      if (this.size != null && bytesUploaded !== this.size) {
        const errMsg = `uploaded only ${bytesUploaded} of ${this.size} with status: ${response.statusCode}`
        logger.error(errMsg, 'upload.multipart.mismatch.error')
        throw new Error(errMsg)
      }

      let bodyURL = null
      try {
        bodyURL = JSON.parse(response.body)?.url
      } catch {
        // response.body can be undefined or an empty string
        // in that case we ignore and continue.
      }

      return {
        url: bodyURL,
        extraData: { response: getRespObj(response), bytesUploaded },
      }
    } catch (err) {
      logger.error(err, 'upload.multipart.error')
      const statusCode = err.response?.statusCode
      if (statusCode != null) {
        throw Object.assign(new Error(err.statusMessage), {
          extraData: getRespObj(err.response),
        })
      }
      throw new Error('Unknown multipart upload error', { cause: err })
    }
  }

  /**
   * Upload the file to S3 using a Multipart upload.
   */
  async #uploadS3Multipart(stream, req) {
    if (!this.options.s3) {
      throw new Error(
        'The S3 client is not configured on this companion instance.',
      )
    }

    const filename = this.uploadFileName
    /**
     * @type {{client: import('@aws-sdk/client-s3').S3Client, options: Record<string, any>}}
     */
    const s3Options = this.options.s3
    const { metadata } = this.options
    const { client, options } = s3Options

    const params = {
      Bucket: getBucket({ bucketOrFn: options.bucket, req, metadata }),
      Key: options.getKey({ req, filename, metadata }),
      ContentType: metadata.type,
      Metadata: rfc2047EncodeMetadata(metadata),
      Body: stream,
    }

    if (options.acl != null) params.ACL = options.acl

    const upload = new Upload({
      client,
      params,
      // using chunkSize as partSize too, see https://github.com/transloadit/uppy/pull/3511
      partSize: this.options.chunkSize,
      leavePartsOnError: true, // https://github.com/aws/aws-sdk-js-v3/issues/2311
    })

    upload.on('httpUploadProgress', ({ loaded, total }) => {
      this.onProgress(loaded, total)
    })

    const data = await upload.done()
    return {
      url: data?.Location || null,
      extraData: {
        response: {
          responseText: JSON.stringify(data),
          headers: {
            'content-type': 'application/json',
          },
        },
      },
    }
  }
}

Uploader.FILE_NAME_PREFIX = 'uppy-file'
Uploader.STORAGE_PREFIX = 'companion'
