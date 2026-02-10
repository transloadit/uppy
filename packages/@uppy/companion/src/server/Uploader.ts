import { randomUUID } from 'node:crypto'
import { createReadStream, createWriteStream, ReadStream } from 'node:fs'
import { stat, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import type { Readable as NodeReadableStream } from 'node:stream'
import { Readable as NodeReadable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import type { PutObjectCommandInput, S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import type { Request } from 'express'
import type { FormDataLike } from 'form-data-encoder'
import type { FormDataEntryValue as NodeFormDataEntryValue } from 'formdata-node'
import { FormData } from 'formdata-node'
import type { OptionsInit, OptionsOfTextResponseBody } from 'got'
import got from 'got'
import type { Redis } from 'ioredis'
import throttle from 'lodash/throttle.js'
import { serializeError } from 'serialize-error'
import tus from 'tus-js-client'
import validator from 'validator'
import emitter, { type EmitterLike } from './emitter/index.js'
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

type UploadProtocol = (typeof PROTOCOLS)[keyof typeof PROTOCOLS]

type CompanionOptionsLike = {
  uploadUrls?: string[]
  uploadHeaders?: Record<string, unknown>
  maxFileSize?: number
  maxFilenameLength?: number
  streamingUpload?: boolean
  tusDeferredUploadLength?: boolean
  filePath?: string
  s3?: Record<string, unknown>
  chunkSize?: number
} & Record<string, unknown>

type UploaderOptions = {
  endpoint?: string
  uploadUrl?: string
  protocol?: UploadProtocol
  size?: number
  fieldname?: string
  pathPrefix: string
  s3?: { client: S3Client; options: unknown } | null
  metadata: Record<string, unknown> & { name?: string; type?: string }
  companionOptions: CompanionOptionsLike
  storage?: Redis | null
  headers?: Record<string, unknown>
  httpMethod?: string
  useFormData?: boolean
  chunkSize?: number
  providerName?: string
}

type UploadResult = {
  url: string | null
  extraData?: Record<string, unknown>
}

function toFormDataLike(form: FormData): FormDataLike {
  function* entries(): Generator<[string, NodeFormDataEntryValue]> {
    // formdata-node returns IterableIterator, which is not assignable to the Generator type that got expects.
    yield* form.entries()
  }

  return {
    append(name, value, fileName) {
      form.append(name, value, fileName)
    },
    getAll(name) {
      return form.getAll(name)
    },
    entries,
    [Symbol.iterator]: entries,
    [Symbol.toStringTag]: form[Symbol.toStringTag],
  }
}

async function onceWithTimeout(
  em: EmitterLike,
  eventName: string,
  timeoutMs?: number,
): Promise<void> {
  const signal = timeoutMs ? AbortSignal.timeout(timeoutMs) : null
  return new Promise((resolve, reject) => {
    let finished = false

    const cleanup = () => {
      if (signal) signal.removeEventListener('abort', onAbort)
      try {
        void em.removeListener(eventName, onEvent)
      } catch {
        // ignore
      }
    }

    const onAbort = () => {
      if (finished) return
      finished = true
      cleanup()
      reject(signal?.reason ?? new Error('Aborted'))
    }

    const onEvent = () => {
      if (finished) return
      finished = true
      cleanup()
      resolve()
    }

    if (signal) signal.addEventListener('abort', onAbort, { once: true })
    void em.once(eventName, onEvent)
  })
}

function exceedsMaxFileSize(
  maxFileSize: number | undefined,
  size: number | undefined,
): boolean {
  return maxFileSize && size && size > maxFileSize
}

export class ValidationError extends Error {
  name = 'ValidationError'
}

function validateOptions(options: UploaderOptions): void {
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
    !Object.values(PROTOCOLS).includes(options.protocol)
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

    const validateUrl = (url: unknown): void => {
      if (url == null) return
      if (typeof url !== 'string')
        throw new ValidationError('invalid destination url')
      const validatorOpts = { require_protocol: true, require_tld: false }
      if (!validator.isURL(url, validatorOpts)) {
        throw new ValidationError('invalid destination url')
      }

      const allowedUrls = options.companionOptions.uploadUrls
      if (allowedUrls && !hasMatch(url, allowedUrls)) {
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
  static FILE_NAME_PREFIX = 'uppy-file'

  static STORAGE_PREFIX = 'companion'

  storage: Redis | null | undefined

  providerName: string | undefined

  options: UploaderOptions

  token: string

  fileName: string

  size: number | undefined

  uploadFileName: string

  downloadedBytes: number

  readStream: NodeReadableStream | null

  tmpPath: string | null

  tus: tus.Upload | null

  throttledEmitProgress: (dataToEmit: {
    action: string
    payload: Record<string, unknown>
  }) => void

  /**
   * Uploads file to destination based on the supplied protocol (tus, s3-multipart, multipart)
   * For tus uploads, the deferredLength option is enabled, because file size value can be unreliable
   * for some providers (Instagram particularly)
   *
   * @param optionsIn
   */
  constructor(optionsIn: UploaderOptions) {
    validateOptions(optionsIn)

    const options = {
      ...optionsIn,
      headers: {
        ...optionsIn.headers,
        ...optionsIn.companionOptions.uploadHeaders,
      },
    } satisfies UploaderOptions

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
    this.tmpPath = null
    this.tus = null

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

    this.throttledEmitProgress = throttle(
      (dataToEmit: { action: string; payload: Record<string, unknown> }) => {
        const { payload } = dataToEmit
        const bytesUploaded =
          typeof payload.bytesUploaded === 'number'
            ? payload.bytesUploaded
            : undefined
        const bytesTotal =
          typeof payload.bytesTotal === 'number'
            ? payload.bytesTotal
            : undefined
        const progress =
          typeof payload.progress === 'string' ? payload.progress : undefined
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
  }

  #uploadState = states.idle

  #canceled = false

  abortReadStream(err: Error): void {
    this.#uploadState = states.done
    if (this.readStream) this.readStream.destroy(err)
  }

  _getUploadProtocol(): UploadProtocol {
    return this.options.protocol || PROTOCOLS.multipart
  }

  async _uploadByProtocol(
    req: Request,
    stream: NodeReadableStream,
  ): Promise<UploadResult> {
    const protocol = this._getUploadProtocol()

    switch (protocol) {
      case PROTOCOLS.multipart:
        return this.#uploadMultipart(stream)
      case PROTOCOLS.s3Multipart:
        return this.#uploadS3Multipart(stream, req)
      case PROTOCOLS.tus:
        return this.#uploadTus(stream)
      default:
        throw new Error('Invalid protocol')
    }
  }

  async _downloadStreamAsFile(stream: NodeReadableStream): Promise<void> {
    this.tmpPath = join(this.options.pathPrefix, this.fileName)

    logger.debug('fully downloading file', 'uploader.download', this.shortToken)
    const writeStream = createWriteStream(this.tmpPath)

    const onData = (chunk: Buffer | string) => {
      const len =
        typeof chunk === 'string' ? Buffer.byteLength(chunk) : chunk.length
      this.downloadedBytes += len
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

  _canStream(): boolean {
    return this.options.companionOptions.streamingUpload
  }

  async uploadStream(
    stream: NodeReadableStream,
    req: Request,
  ): Promise<UploadResult | undefined> {
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

      const activeStream = this.readStream
      if (!activeStream) throw new Error('No readable stream available')

      const { url, extraData } = await Promise.race([
        this._uploadByProtocol(req, activeStream),
        // If we don't handle stream errors, we get unhandled error in node.
        new Promise<never>((_resolve, reject) =>
          activeStream.on('error', reject),
        ),
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

  tryDeleteTmpPath(): void {
    if (this.tmpPath) unlink(this.tmpPath).catch(() => {})
  }

  async tryUploadStream(
    stream: NodeReadableStream,
    req: Request,
  ): Promise<void> {
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
   */
  static shortenToken(token: string): string {
    return token.substring(0, 8)
  }

  static reqToOptions(req: Request, size: number | undefined): UploaderOptions {
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
      chunkSize:
        typeof req.companion.options.chunkSize === 'number'
          ? req.companion.options.chunkSize
          : undefined,
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

  async awaitReady(timeout?: number): Promise<void> {
    logger.debug(
      'waiting for socket connection',
      'uploader.socket.wait',
      this.shortToken,
    )

    const eventName = `connection:${this.token}`
    await onceWithTimeout(emitter(), eventName, timeout)

    logger.debug(
      'socket connection received',
      'uploader.socket.wait',
      this.shortToken,
    )
  }

  /**
   * Persist the latest upload state to Redis so a reconnecting client can resume.
   */
  saveState(state: { action: string; payload: Record<string, unknown> }): void {
    if (!this.storage) return
    // make sure the keys get cleaned up.
    // https://github.com/transloadit/uppy/issues/3748
    const keyExpirySec = 60 * 60 * 24
    const redisKey = `${Uploader.STORAGE_PREFIX}:${this.token}`
    this.storage.set(redisKey, jsonStringify(state), 'EX', keyExpirySec)
  }

  onProgress(
    bytesUploaded = 0,
    bytesTotalIn: number | null | undefined = 0,
  ): void {
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

  #emitSuccess(
    url: string | null,
    extraData: Record<string, unknown> | undefined,
  ): void {
    const emitData = {
      action: 'success',
      payload: { ...extraData, complete: true, url },
    }
    this.saveState(emitData)
    emitter().emit(this.token, emitData)
  }

  async #emitError(err: Error): Promise<void> {
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
   */
  async #uploadTus(stream: NodeReadableStream): Promise<UploadResult> {
    const uploader = this

    const isFileStream = stream instanceof ReadStream
    // chunkSize needs to be a finite value if the stream is not a file stream (fs.createReadStream)
    // https://github.com/tus/tus-js-client/blob/4479b78032937ac14da9b0542e489ac6fe7e0bc7/lib/node/fileReader.js#L50
    const chunkSize = this.options.chunkSize || (isFileStream ? Infinity : 50e6)

    type TusUploadOptions = ConstructorParameters<typeof tus.Upload>[1]

    const tusRet = await new Promise<UploadResult>((resolve, reject) => {
      const tusOptions: TusUploadOptions = {
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
          filetype:
            typeof this.options.metadata.type === 'string'
              ? this.options.metadata.type
              : '',
          ...Object.fromEntries(
            Object.entries(this.options.metadata).map(([k, v]) => [k, `${v}`]),
          ),
        },
        onError(error) {
          logger.error(error, 'uploader.tus.error')
          // deleting tus originalRequest field because it uses the same http-agent
          // as companion, and this agent may contain sensitive request details (e.g headers)
          // previously made to providers. Deleting the field would prevent it from getting leaked
          // to the frontend etc.
          Reflect.deleteProperty(error, 'originalRequest')
          Reflect.deleteProperty(error, 'originalResponse')
          reject(error)
        },
        onProgress(bytesUploaded, bytesTotal) {
          uploader.onProgress(bytesUploaded, bytesTotal)
        },
        onSuccess() {
          resolve({ url: uploader.tus?.url ?? null })
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

      const nodeReader = NodeReadable.toWeb(stream).getReader()
      const reader: Pick<ReadableStreamDefaultReader<unknown>, 'read'> = {
        async read() {
          const { done, value } = await nodeReader.read()
          // Ensure we always provide `value`, since some ReadableStream lib variants
          // type it differently when `done: true`.
          return done
            ? { done: true, value: undefined }
            : { done: false, value }
        },
      }

      this.tus = new tus.Upload(reader, tusOptions)

      this.tus.start()
    })

    if (this.size != null) {
      const tusSize = Reflect.get(this.tus, '_size')
      if (typeof tusSize === 'number' && tusSize !== this.size) {
        logger.warn(
          `Tus uploaded size ${tusSize} different from reported URL size ${this.size}`,
          'upload.tus.mismatch.error',
        )
      }
    }

    return tusRet
  }

  async #uploadMultipart(stream: NodeReadableStream): Promise<UploadResult> {
    if (!this.options.endpoint) {
      throw new Error('No multipart endpoint set')
    }

    function getRespObj(response: unknown): Record<string, unknown> {
      const isRecord = (value: unknown): value is Record<string, unknown> =>
        !!value && typeof value === 'object' && !Array.isArray(value)
      const resp = isRecord(response) ? response : {}
      const headers = isRecord(resp.headers) ? resp.headers : {}
      // remove browser forbidden headers
      const {
        'set-cookie': deleted,
        'set-cookie2': deleted2,
        ...responseHeaders
      } = headers

      return {
        responseText: resp.body,
        status: resp.statusCode,
        statusText: resp.statusMessage,
        headers: responseHeaders,
      }
    }

    // upload progress
    let bytesUploaded = 0
    stream.on('data', (data: Buffer | string) => {
      bytesUploaded +=
        typeof data === 'string' ? Buffer.byteLength(data) : data.length
      this.onProgress(bytesUploaded, undefined)
    })

    const url = this.options.endpoint
    const reqOptions: OptionsInit = {
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

      reqOptions.body = toFormDataLike(formData)
    } else {
      if (this.size != null) {
        reqOptions.headers = {
          ...(typeof reqOptions.headers === 'object' ? reqOptions.headers : {}),
          'content-length': `${this.size}`,
        }
      }
      reqOptions.body = stream
    }

    try {
      const httpMethod =
        (this.options.httpMethod || '').toUpperCase() === 'PUT' ? 'put' : 'post'
      const requestOptions: OptionsOfTextResponseBody = {
        ...reqOptions,
        isStream: false,
        resolveBodyOnly: false,
        responseType: 'text',
      }
      const response =
        httpMethod === 'put'
          ? await got.put(url, requestOptions)
          : await got.post(url, requestOptions)

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
      const isRecord = (value: unknown): value is Record<string, unknown> =>
        !!value && typeof value === 'object' && !Array.isArray(value)
      const errObj = isRecord(err) ? err : null
      const response =
        errObj && isRecord(errObj.response) ? errObj.response : null
      const statusCode =
        response && typeof response.statusCode === 'number'
          ? response.statusCode
          : undefined

      if (statusCode != null) {
        const statusMessage =
          typeof errObj?.statusMessage === 'string'
            ? errObj.statusMessage
            : 'Request failed'
        throw Object.assign(new Error(statusMessage), {
          extraData: getRespObj(response),
        })
      }

      throw new Error('Unknown multipart upload error', { cause: err })
    }
  }

  /**
   * Upload the file to S3 using a Multipart upload.
   */
  async #uploadS3Multipart(
    stream: NodeReadableStream,
    req: Request,
  ): Promise<UploadResult> {
    if (!this.options.s3) {
      throw new Error(
        'The S3 client is not configured on this companion instance.',
      )
    }

    const filename = this.uploadFileName
    const s3Options = this.options.s3
    const { metadata } = this.options
    const { client, options } = s3Options

    const isRecord = (value: unknown): value is Record<string, unknown> =>
      !!value && typeof value === 'object' && !Array.isArray(value)

    if (!isRecord(options)) {
      throw new TypeError('Invalid S3 options')
    }

    const bucketOrFn = options.bucket
    const getKey = options.getKey

    if (typeof getKey !== 'function') {
      throw new TypeError('s3.getKey must be a function')
    }
    const keyCandidate = getKey({ req, filename, metadata })
    if (typeof keyCandidate !== 'string' || keyCandidate === '') {
      throw new TypeError('s3.getKey must return a non-empty string')
    }

    const params: PutObjectCommandInput = {
      Bucket: getBucket({ bucketOrFn, req, metadata, filename }),
      Key: keyCandidate,
      ContentType:
        typeof metadata.type === 'string' ? metadata.type : undefined,
      Metadata: rfc2047EncodeMetadata(metadata),
      Body: stream,
    }

    if (typeof options.acl === 'string') Reflect.set(params, 'ACL', options.acl)

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
