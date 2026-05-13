import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { createReadStream, createWriteStream, ReadStream } from 'node:fs'
import { stat, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import type { EventEmitter, Readable as NodeReadableStream } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import type { PutObjectCommandInput, S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import type { Request } from 'express'
import type { FormDataLike } from 'form-data-encoder'
import { FormData } from 'formdata-node'
import type { OptionsOfTextResponseBody, Response } from 'got'
import got from 'got'
import type { Redis } from 'ioredis'
import throttle from 'lodash/throttle.js'
import { serializeError } from 'serialize-error'
import tus from 'tus-js-client'
import validator from 'validator'
import type { CompanionRuntimeOptions } from '../types/companion-options.js'
import emitter from './emitter/index.js'
import headerSanitize from './header-blacklist.js'
import { isRecord, toError } from './helpers/type-guards.js'
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

type Metadata = Record<string, unknown> & { name?: string; type?: string }

type UploaderOptions = {
  endpoint?: string
  uploadUrl?: string
  protocol?: UploadProtocol
  size?: number
  fieldname?: string
  pathPrefix: string
  s3?: { client: S3Client; options: CompanionRuntimeOptions['s3'] } | null
  metadata: Metadata
  companionOptions: Pick<
    CompanionRuntimeOptions,
    | 'uploadUrls'
    | 'uploadHeaders'
    | 'maxFileSize'
    | 'maxFilenameLength'
    | 'tusDeferredUploadLength'
  > & {
    streamingUpload?: CompanionRuntimeOptions['streamingUpload'] | undefined
  }
  storage?: Redis | null
  headers?: Record<string, unknown>
  httpMethod?: string
  useFormData?: boolean
  chunkSize?: number
  providerName?: string
}

export interface ProgressPayload {
  progress: string
  bytesUploaded: number
  bytesTotal: number
}

export interface UploadExtraDataResponse {
  status?: number | undefined
  statusText?: string | undefined
  responseText?: string
  headers?: Record<string, unknown>
}

export interface UploadExtraData {
  response: UploadExtraDataResponse
  bytesUploaded?: number
}

export interface UploadResult {
  url: string | null
  extraData?: UploadExtraData | undefined
}

function exceedsMaxFileSize(
  maxFileSize: number | undefined,
  size: number | undefined,
): boolean {
  return maxFileSize !== undefined && size !== undefined && size > maxFileSize
}

export class ValidationError extends Error {
  override name = 'ValidationError'
}

function validateOptions(options: UploaderOptions): void {
  // validate HTTP Method (optional)
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

  // validate fieldname (optional)
  if (options.fieldname != null && typeof options.fieldname !== 'string') {
    throw new ValidationError('fieldname must be a string')
  }

  // validate metadata (optional)
  if (options.metadata != null && typeof options.metadata !== 'object') {
    throw new ValidationError('metadata must be an object')
  }

  // validate headers (optional)
  if (options.headers != null && typeof options.headers !== 'object') {
    throw new ValidationError('headers must be an object')
  }

  // validate protocol (optional)
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

    const validateUrl = (url: string | undefined): void => {
      if (url == null) return
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

  fieldname: string

  metadata: Metadata

  throttledEmitProgress: (dataToEmit: {
    action: string
    payload: ProgressPayload
  }) => void

  /**
   * Uploads file to destination based on the supplied protocol (tus, s3-multipart, multipart)
   * For tus uploads, the deferredLength option is enabled, because file size value can be unreliable
   * for some providers.
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
    const metadata = {
      ...(this.providerName != null && { provider: this.providerName }),
      ...(options.metadata || {}), // allow user to override provider
    }
    this.metadata = metadata
    this.fieldname = options.fieldname || DEFAULT_FIELD_NAME
    this.size = options.size
    const { maxFilenameLength } = options.companionOptions

    // Define upload file name
    this.uploadFileName = truncateFilename(
      metadata.name || this.fileName,
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
      (dataToEmit: { action: string; payload: ProgressPayload }) => {
        const {
          payload: { bytesUploaded, bytesTotal, progress },
        } = dataToEmit
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
    return !!this.options.companionOptions.streamingUpload
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

  async tryDeleteTmpPath(): Promise<void> {
    if (!this.tmpPath) return
    try {
      await unlink(this.tmpPath)
    } catch {}
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
    const body: Record<string, unknown> = isRecord(req.body) ? req.body : {}

    const useFormDataValue = body['useFormData']
    const useFormData =
      typeof useFormDataValue === 'boolean' ? useFormDataValue : true

    const headers = body['headers']
    if (headers != null && !isRecord(headers)) {
      throw new ValidationError('headers must be an object')
    }

    const metadataValue = body['metadata']
    if (metadataValue != null && !isRecord(metadataValue)) {
      throw new ValidationError('metadata must be an object')
    }
    const metadata = metadataValue ?? {}

    const httpMethod = body['httpMethod']
    if (httpMethod != null && typeof httpMethod !== 'string') {
      throw new ValidationError('unsupported HTTP METHOD specified')
    }

    const protocolValue = body['protocol']
    let protocol: UploadProtocol | undefined
    if (protocolValue != null) {
      if (typeof protocolValue !== 'string')
        throw new ValidationError('unsupported protocol specified')
      if (
        protocolValue === PROTOCOLS.multipart ||
        protocolValue === PROTOCOLS.s3Multipart ||
        protocolValue === PROTOCOLS.tus
      ) {
        protocol = protocolValue
      } else {
        throw new ValidationError('unsupported protocol specified')
      }
    }

    const endpoint = body['endpoint']
    if (endpoint != null && typeof endpoint !== 'string') {
      throw new ValidationError('invalid destination url')
    }

    const uploadUrl = body['uploadUrl']
    if (uploadUrl != null && typeof uploadUrl !== 'string') {
      throw new ValidationError('invalid destination url')
    }

    const fieldname = body['fieldname']
    if (fieldname != null && typeof fieldname !== 'string') {
      throw new ValidationError('fieldname must be a string')
    }

    const companionOptions = req.companion.options
    const { filePath } = companionOptions
    const chunkSizeValue = companionOptions['chunkSize']
    const chunkSize =
      typeof chunkSizeValue === 'number' ? chunkSizeValue : undefined

    const storage = redis.client()

    return {
      // Client provided info (must be validated and not blindly trusted):
      ...(headers != null && { headers }),
      ...(httpMethod != null && { httpMethod }),
      ...(protocol != null && { protocol }),
      ...(endpoint != null && { endpoint }),
      ...(uploadUrl != null && { uploadUrl }),
      ...(fieldname != null && { fieldname }),
      useFormData,
      metadata,

      ...(req.companion.providerName != null && {
        providerName: req.companion.providerName,
      }),

      // Info coming from companion server configuration:
      ...(size != null && { size }),
      companionOptions,
      pathPrefix: filePath,
      ...(storage != null && { storage }),
      s3: req.companion.s3Client
        ? {
            client: req.companion.s3Client,
            options: companionOptions.s3,
          }
        : null,
      ...(chunkSize != null && { chunkSize }),
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

  async awaitReady(timeout: number): Promise<void> {
    logger.debug(
      'waiting for socket connection',
      'uploader.socket.wait',
      this.shortToken,
    )

    const eventName = `connection:${this.token}`
    await once(emitter() as EventEmitter, eventName, {
      signal: AbortSignal.timeout(timeout),
    })

    logger.debug(
      'socket connection received',
      'uploader.socket.wait',
      this.shortToken,
    )
  }

  /**
   * Persist the latest upload state to Redis so a reconnecting client can resume.
   */
  saveState(state: { action: string; payload: unknown }): void {
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
    extraData: UploadExtraData | undefined,
  ): void {
    const emitData = {
      action: 'success',
      payload: { ...extraData, complete: true, url },
    }
    this.saveState(emitData)
    emitter().emit(this.token, emitData)
  }

  async #emitError(err: unknown): Promise<void> {
    const error = toError(err)
    // delete stack to avoid sending server info to client
    // see PR discussion https://github.com/transloadit/uppy/pull/3832
    const { stack, ...serializedErr } = serializeError(error)
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
        ...(this.options.endpoint != null && {
          endpoint: this.options.endpoint,
        }),
        ...(this.options.uploadUrl != null && {
          uploadUrl: this.options.uploadUrl,
        }),
        retryDelays: [0, 1000, 3000, 5000],
        chunkSize,
        headers: headerSanitize(this.options.headers),
        addRequestId: true,
        metadata: {
          // file name and type as required by the tusd tus server
          // https://github.com/tus/tusd/blob/5b376141903c1fd64480c06dde3dfe61d191e53d/unrouted_handler.go#L614-L646
          filename: this.uploadFileName,
          ...(this.metadata.type != null && {
            filetype: this.metadata.type,
          }),
          ...Object.fromEntries(
            Object.entries(this.metadata).map(([k, v]) => [k, String(v)]),
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
          return
        }
        tusOptions.uploadLengthDeferred = false
        tusOptions.uploadSize = this.size
      }

      this.tus = new tus.Upload(stream, tusOptions)

      this.tus.start()
    })

    if (this.tus != null && this.size != null) {
      const tusSize: unknown = Reflect.get(this.tus, '_size')
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

    function getRespObj(response: Response<string>): UploadExtraDataResponse {
      // remove browser forbidden headers
      const {
        'set-cookie': deleted,
        'set-cookie2': deleted2,
        ...headers
      } = response.headers

      return {
        responseText: response.body,
        status: response.statusCode,
        statusText: response.statusMessage,
        headers,
      }
    }

    // upload progress
    let bytesUploaded = 0
    stream.on('data', (data) => {
      bytesUploaded += data.length
      this.onProgress(bytesUploaded, undefined)
    })

    const url = this.options.endpoint
    const reqOptions: OptionsOfTextResponseBody = {
      headers: headerSanitize(this.options.headers),
      isStream: false,
      resolveBodyOnly: false,
      responseType: 'text',
    }

    if (this.options.useFormData) {
      const formData = new FormData()

      Object.entries(this.metadata).forEach(([key, value]) =>
        formData.append(key, value),
      )

      // see https://github.com/octet-stream/form-data/blob/73a5a24e635938026538673f94cbae1249a3f5cc/readme.md?plain=1#L232
      formData.set(this.fieldname, {
        type: this.metadata.type || 'application/octet-stream',
        name: this.uploadFileName,
        [Symbol.toStringTag]: 'File',
        stream() {
          return stream
        },
      })

      reqOptions.body = formData as FormDataLike
    } else {
      if (this.size != null) {
        reqOptions.headers = {
          ...reqOptions.headers,
          'content-length': `${this.size}`,
        }
      }
      reqOptions.body = stream
    }

    try {
      const httpMethod =
        (this.options.httpMethod ?? '').toUpperCase() === 'PUT' ? 'put' : 'post'
      const response = await got[httpMethod](url, reqOptions)

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
      const errObj = isRecord(err) ? err : null
      const response =
        errObj && isRecord(errObj['response']) ? errObj['response'] : null
      const statusCode =
        response && typeof response['statusCode'] === 'number'
          ? response['statusCode']
          : undefined

      if (statusCode != null) {
        const statusMessage =
          typeof errObj?.['statusMessage'] === 'string'
            ? errObj['statusMessage']
            : 'Request failed'
        throw Object.assign(new Error(statusMessage), {
          extraData: getRespObj(response as unknown as Response<string>),
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
    const { metadata } = this
    const { client, options } = s3Options

    const params: PutObjectCommandInput = {
      Bucket: getBucket({
        bucketOrFn: options.bucket,
        req,
        metadata,
        filename,
      }),
      Key: options.getKey({ req, filename, metadata }),
      ContentType: metadata.type,
      Metadata: rfc2047EncodeMetadata(metadata),
      Body: stream,
      ...(options['acl'] != null && {
        ACL: options['acl'],
      }),
    }

    const upload = new Upload({
      client,
      params,
      // using chunkSize as partSize too, see https://github.com/transloadit/uppy/pull/3511
      ...(this.options.chunkSize != null && {
        partSize: this.options.chunkSize,
      }),
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
          status: data.$metadata.httpStatusCode,

          responseText: JSON.stringify(data),
          headers: {
            'content-type': 'application/json',
          },
        },
      },
    }
  }
}
