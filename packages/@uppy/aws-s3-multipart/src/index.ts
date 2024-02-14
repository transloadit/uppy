import BasePlugin, {
  type DefinePluginOpts,
  type PluginOpts,
} from '@uppy/core/lib/BasePlugin.js'
import { RequestClient } from '@uppy/companion-client'
import type { RequestOptions } from '@uppy/companion-client/lib/RequestClient'
import type { Body, Meta, UppyFile } from '@uppy/utils/lib/UppyFile'
import type { Uppy } from '@uppy/core'
import EventManager from '@uppy/utils/lib/EventManager'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore untyped
import { RateLimitedQueue } from '@uppy/utils/lib/RateLimitedQueue'
import {
  filterNonFailedFiles,
  filterFilesToEmitUploadStarted,
} from '@uppy/utils/lib/fileFilters'
import { createAbortError } from '@uppy/utils/lib/AbortController'

import MultipartUploader, {
  pausingUploadReason,
  type Chunk,
} from './MultipartUploader.ts'
import createSignedURL from './createSignedURL.ts'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../package.json'

type PartUploadedCallback<M extends Meta, B extends Body> = (
  file: UppyFile<M, B>,
  part: { PartNumber: number; ETag: string },
) => void

declare module '@uppy/core' {
  export interface UppyEventMap<M extends Meta, B extends Body> {
    's3-multipart:part-uploaded': PartUploadedCallback<M, B>
  }
}

function assertServerError<T>(res: T): T {
  if ((res as any)?.error) {
    const error = new Error((res as any).message)
    Object.assign(error, (res as any).error)
    throw error
  }
  return res
}

function removeMetadataFromURL(urlString: string) {
  const urlObject = new URL(urlString)
  urlObject.search = ''
  urlObject.hash = ''
  return urlObject.href
}

export interface AwsS3STSResponse {
  credentials: {
    AccessKeyId: string
    SecretAccessKey: string
    SessionToken: string
    Expiration?: string
  }
  bucket: string
  region: string
}

/**
 * Computes the expiry time for a request signed with temporary credentials. If
 * no expiration was provided, or an invalid value (e.g. in the past) is
 * provided, undefined is returned. This function assumes the client clock is in
 * sync with the remote server, which is a requirement for the signature to be
 * validated for AWS anyway.
 */
function getExpiry(
  credentials: AwsS3STSResponse['credentials'],
): number | undefined {
  const expirationDate = credentials.Expiration
  if (expirationDate) {
    const timeUntilExpiry = Math.floor(
      ((new Date(expirationDate) as any as number) - Date.now()) / 1000,
    )
    if (timeUntilExpiry > 9) {
      return timeUntilExpiry
    }
  }
  return undefined
}

function getAllowedMetadata<M extends Record<string, any>>({ meta, allowedMetaFields, querify = false }: {
  meta: M,
  allowedMetaFields?: string[],
  querify?: boolean,
}) {
  const metaFields = allowedMetaFields ?? Object.keys(meta)

  if (!meta) return {}

  return Object.fromEntries(
    metaFields
      .filter((key) => meta[key] != null)
      .map((key) => {
        const realKey = querify ? `metadata[${key}]` : key
        const value = String(meta[key])
        return [realKey, value]
      }),
  )
}

function throwIfAborted(signal?: AbortSignal | null) {
  if (signal?.aborted) {
    throw createAbortError('The operation was aborted', {
      cause: signal.reason,
    })
  }
}

type AbortablePromise<T extends (...args: any) => Promise<any>> = (
  ...args: Parameters<T>
) => ReturnType<T> & {
  abort: (reason?: any) => void
  abortOn: (signal?: AbortSignal) => ReturnType<T>
}

type UploadResult = { key: string; uploadId: string }
type UploadResultWithSignal = UploadResult & { signal?: AbortSignal }
type MultipartUploadResult = UploadResult & { parts: AwsS3Part[] }
type MultipartUploadResultWithSignal = MultipartUploadResult & { signal?: AbortSignal }

class HTTPCommunicationQueue<M extends Meta, B extends Body> {
  #abortMultipartUpload: AbortablePromise<
    (typeof AwsS3Multipart<M, B>)['prototype']['abortMultipartUpload']
  >

  #cache = new WeakMap()

  #createMultipartUpload: AbortablePromise<
    (typeof AwsS3Multipart<M, B>)['prototype']['createMultipartUpload']
  >

  #fetchSignature: AbortablePromise<
    (typeof AwsS3Multipart<M, B>)['prototype']['signPart']
  >

  #getUploadParameters: AbortablePromise<
    (typeof AwsS3Multipart<M, B>)['prototype']['getUploadParameters']
  >

  #listParts: AbortablePromise<
    (typeof AwsS3Multipart<M, B>)['prototype']['listParts']
  >

  #previousRetryDelay: number

  #requests

  #retryDelays: { values: () => Iterator<number> }

  #sendCompletionRequest: AbortablePromise<
    (typeof AwsS3Multipart<M, B>)['prototype']['completeMultipartUpload']
  >

  #setS3MultipartState

  #uploadPartBytes: AbortablePromise<
    (typeof AwsS3Multipart<M, B>)['uploadPartBytes']
  >

  #getFile

  constructor(
    requests: RateLimitedQueue,
    options: AwsS3MultipartOptions<M, B>,
    setS3MultipartState: (file: UppyFile<M, B>, result: UploadResult) => void,
    getFile: (file: UppyFile<M, B>) => UppyFile<M, B>,
  ) {
    this.#requests = requests
    this.#setS3MultipartState = setS3MultipartState
    this.#getFile = getFile
    this.setOptions(options)
  }

  setOptions(options: Partial<AwsS3MultipartOptions<M, B>>) {
    const requests = this.#requests

    if ('abortMultipartUpload' in options) {
      this.#abortMultipartUpload = requests.wrapPromiseFunction(
        options.abortMultipartUpload,
        { priority: 1 },
      )
    }
    if ('createMultipartUpload' in options) {
      this.#createMultipartUpload = requests.wrapPromiseFunction(
        options.createMultipartUpload,
        { priority: -1 },
      )
    }
    if ('signPart' in options) {
      this.#fetchSignature = requests.wrapPromiseFunction(options.signPart)
    }
    if ('listParts' in options) {
      this.#listParts = requests.wrapPromiseFunction(options.listParts)
    }
    if ('completeMultipartUpload' in options) {
      this.#sendCompletionRequest = requests.wrapPromiseFunction(
        options.completeMultipartUpload,
        { priority: 1 },
      )
    }
    if ('retryDelays' in options) {
      this.#retryDelays = options.retryDelays ?? []
    }
    if ('uploadPartBytes' in options) {
      this.#uploadPartBytes = requests.wrapPromiseFunction(
        options.uploadPartBytes,
        { priority: Infinity },
      )
    }
    if ('getUploadParameters' in options) {
      this.#getUploadParameters = requests.wrapPromiseFunction(
        options.getUploadParameters,
      )
    }
  }

  async #shouldRetry(err: any, retryDelayIterator: Iterator<number>) {
    const requests = this.#requests
    const status = err?.source?.status

    // TODO: this retry logic is taken out of Tus. We should have a centralized place for retrying,
    // perhaps the rate limited queue, and dedupe all plugins with that.
    if (status == null) {
      return false
    }
    if (status === 403 && err.message === 'Request has expired') {
      if (!requests.isPaused) {
        // We don't want to exhaust the retryDelayIterator as long as there are
        // more than one request in parallel, to give slower connection a chance
        // to catch up with the expiry set in Companion.
        if (requests.limit === 1 || this.#previousRetryDelay == null) {
          const next = retryDelayIterator.next()
          if (next == null || next.done) {
            return false
          }
          // If there are more than 1 request done in parallel, the RLQ limit is
          // decreased and the failed request is requeued after waiting for a bit.
          // If there is only one request in parallel, the limit can't be
          // decreased, so we iterate over `retryDelayIterator` as we do for
          // other failures.
          // `#previousRetryDelay` caches the value so we can re-use it next time.
          this.#previousRetryDelay = next.value
        }
        // No need to stop the other requests, we just want to lower the limit.
        requests.rateLimit(0)
        await new Promise((resolve) =>
          setTimeout(resolve, this.#previousRetryDelay),
        )
      }
    } else if (status === 429) {
      // HTTP 429 Too Many Requests => to avoid the whole download to fail, pause all requests.
      if (!requests.isPaused) {
        const next = retryDelayIterator.next()
        if (next == null || next.done) {
          return false
        }
        requests.rateLimit(next.value)
      }
    } else if (status > 400 && status < 500 && status !== 409) {
      // HTTP 4xx, the server won't send anything, it's doesn't make sense to retry
      return false
    } else if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      // The navigator is offline, let's wait for it to come back online.
      if (!requests.isPaused) {
        requests.pause()
        window.addEventListener(
          'online',
          () => {
            requests.resume()
          },
          { once: true },
        )
      }
    } else {
      // Other error code means the request can be retried later.
      const next = retryDelayIterator.next()
      if (next == null || next.done) {
        return false
      }
      await new Promise((resolve) => setTimeout(resolve, next.value))
    }
    return true
  }

  async getUploadId(file: UppyFile<M, B>, signal: AbortSignal) {
    let cachedResult
    // As the cache is updated asynchronously, there could be a race condition
    // where we just miss a new result so we loop here until we get nothing back,
    // at which point it's out turn to create a new cache entry.
    // eslint-disable-next-line no-cond-assign
    while ((cachedResult = this.#cache.get(file.data)) != null) {
      try {
        return await cachedResult
      } catch {
        // In case of failure, we want to ignore the cached error.
        // At this point, either there's a new cached value, or we'll exit the loop a create a new one.
      }
    }

    const promise = this.#createMultipartUpload(this.#getFile(file), signal)

    const abortPromise = () => {
      promise.abort(signal.reason)
      this.#cache.delete(file.data)
    }
    signal.addEventListener('abort', abortPromise, { once: true })
    this.#cache.set(file.data, promise)
    promise.then(
      async (result) => {
        signal.removeEventListener('abort', abortPromise)
        this.#setS3MultipartState(file, result)
        this.#cache.set(file.data, result)
      },
      () => {
        signal.removeEventListener('abort', abortPromise)
        this.#cache.delete(file.data)
      },
    )

    return promise
  }

  async abortFileUpload(file: UppyFile<M, B>) {
    const result = this.#cache.get(file.data)
    if (result == null) {
      // If the createMultipartUpload request never was made, we don't
      // need to send the abortMultipartUpload request.
      return
    }
    // Remove the cache entry right away for follow-up requests do not try to
    // use the soon-to-be aborted cached values.
    this.#cache.delete(file.data)
    this.#setS3MultipartState(file, Object.create(null))
    let awaitedResult
    try {
      awaitedResult = await result
    } catch {
      // If the cached result rejects, there's nothing to abort.
      return
    }
    await this.#abortMultipartUpload(this.#getFile(file), awaitedResult)
  }

  async #nonMultipartUpload(
    file: UppyFile<M, B>,
    chunk: Chunk,
    signal?: AbortSignal,
  ) {
    const {
      method = 'POST',
      url,
      fields,
      headers,
    } = await this.#getUploadParameters(this.#getFile(file), {
      signal,
    }).abortOn(signal)

    let body
    const data = chunk.getData()
    if (method.toUpperCase() === 'POST') {
      const formData = new FormData()
      Object.entries(fields!).forEach(([key, value]) => formData.set(key, value))
      formData.set('file', data)
      body = formData
    } else {
      body = data
    }

    const { onProgress, onComplete } = chunk

    const result = await this.#uploadPartBytes({
      signature: { url, headers, method },
      body,
      size: data.size,
      onProgress,
      onComplete,
      signal,
    }).abortOn(signal)

    return 'location' in result
      ? result
      : {
          location: removeMetadataFromURL(url),
          ...result,
        }
  }

  async uploadFile(file: UppyFile<M, B>, chunks: Chunk[], signal: AbortSignal) {
    throwIfAborted(signal)
    if (chunks.length === 1 && !chunks[0].shouldUseMultipart) {
      return this.#nonMultipartUpload(file, chunks[0], signal)
    }
    const { uploadId, key } = await this.getUploadId(file, signal)
    throwIfAborted(signal)
    try {
      const parts = await Promise.all(
        chunks.map((chunk, i) => this.uploadChunk(file, i + 1, chunk, signal)),
      )
      throwIfAborted(signal)
      return await this.#sendCompletionRequest(
        this.#getFile(file),
        { key, uploadId, parts, signal },
        signal,
      ).abortOn(signal)
    } catch (err) {
      if (err?.cause !== pausingUploadReason && err?.name !== 'AbortError') {
        // We purposefully don't wait for the promise and ignore its status,
        // because we want the error `err` to bubble up ASAP to report it to the
        // user. A failure to abort is not that big of a deal anyway.
        this.abortFileUpload(file)
      }
      throw err
    }
  }

  restoreUploadFile(file: UppyFile<M, B>, uploadIdAndKey: UploadResult) {
    this.#cache.set(file.data, uploadIdAndKey)
  }

  async resumeUploadFile(
    file: UppyFile<M, B>,
    chunks: Chunk[],
    signal: AbortSignal,
  ) {
    throwIfAborted(signal)
    if (
      chunks.length === 1 &&
      chunks[0] != null &&
      !chunks[0].shouldUseMultipart
    ) {
      return this.#nonMultipartUpload(file, chunks[0], signal)
    }
    const { uploadId, key } = await this.getUploadId(file, signal)
    throwIfAborted(signal)
    const alreadyUploadedParts = await this.#listParts(
      this.#getFile(file),
      { uploadId, key, signal },
      signal,
    ).abortOn(signal)
    throwIfAborted(signal)
    const parts = await Promise.all(
      chunks.map((chunk, i) => {
        const partNumber = i + 1
        const alreadyUploadedInfo = alreadyUploadedParts.find(
          ({ PartNumber }) => PartNumber === partNumber,
        )
        if (alreadyUploadedInfo == null) {
          return this.uploadChunk(file, partNumber, chunk, signal)
        }
        // Already uploaded chunks are set to null. If we are restoring the upload, we need to mark it as already uploaded.
        chunk?.setAsUploaded?.()
        return { PartNumber: partNumber, ETag: alreadyUploadedInfo.ETag }
      }),
    )
    throwIfAborted(signal)
    return this.#sendCompletionRequest(
      this.#getFile(file),
      { key, uploadId, parts, signal },
      signal,
    ).abortOn(signal)
  }

  async uploadChunk(
    file: UppyFile<M, B>,
    partNumber: number,
    chunk: Chunk,
    signal: AbortSignal,
  ) {
    throwIfAborted(signal)
    const { uploadId, key } = await this.getUploadId(file, signal)

    const signatureRetryIterator = this.#retryDelays.values()
    const chunkRetryIterator = this.#retryDelays.values()
    const shouldRetrySignature = () => {
      const next = signatureRetryIterator.next()
      if (next == null || next.done) {
        return null
      }
      return next.value
    }

    for (;;) {
      throwIfAborted(signal)
      const chunkData = chunk.getData()
      const { onProgress, onComplete } = chunk
      let signature

      try {
        signature = await this.#fetchSignature(this.#getFile(file), {
          uploadId,
          key,
          partNumber,
          body: chunkData,
          signal,
        }).abortOn(signal)
      } catch (err) {
        const timeout = shouldRetrySignature()
        if (timeout == null || signal.aborted) {
          throw err
        }
        await new Promise((resolve) => setTimeout(resolve, timeout))
        // eslint-disable-next-line no-continue
        continue
      }

      throwIfAborted(signal)
      try {
        return {
          PartNumber: partNumber,
          ...(await this.#uploadPartBytes({
            signature,
            body: chunkData,
            size: chunkData.size,
            onProgress,
            onComplete,
            signal,
          }).abortOn(signal)),
        }
      } catch (err) {
        if (!(await this.#shouldRetry(err, chunkRetryIterator))) throw err
      }
    }
  }
}

type MaybePromise<T> = T | Promise<T>

type SignPartOptions = {
  uploadId: string
  key: string
  partNumber: number
  body: Blob
  signal?: AbortSignal
}

export type AwsS3UploadParameters =
  | {
      method: 'POST'
      url: string
      fields: Record<string, string>
      expires?: number
      headers?: Record<string, string>
    }
  | {
      method?: 'PUT'
      url: string
      fields?: Record<string, never>
      expires?: number
      headers?: Record<string, string>
    }

export interface AwsS3Part {
  PartNumber?: number
  Size?: number
  ETag?: string
}

type AWSS3WithCompanion = {
  companionUrl: string
  companionHeaders?: Record<string, string>
  companionCookiesRule?: string
  getTemporarySecurityCredentials?: true
}
type AWSS3WithoutCompanion = {
  companionUrl?: never
  companionHeaders?: never
  companionCookiesRule?: never
  getTemporarySecurityCredentials?: (options?: {
    signal?: AbortSignal
  }) => MaybePromise<AwsS3STSResponse>
}

type AWSS3NonMultipartWithCompanionMandatory = {
  getUploadParameters?: never
}

type AWSS3NonMultipartWithoutCompanionMandatory<
  M extends Meta,
  B extends Body,
> = {
  getUploadParameters: (
    file: UppyFile<M, B>,
  ) => MaybePromise<AwsS3UploadParameters>
}
type AWSS3NonMultipartWithCompanion = AWSS3WithCompanion &
  AWSS3NonMultipartWithCompanionMandatory & {
    shouldUseMultipart: false
    createMultipartUpload?: never
    listParts?: never
    signPart?: never
    abortMultipartUpload?: never
    completeMultipartUpload?: never
  }

type AWSS3NonMultipartWithoutCompanion<
  M extends Meta,
  B extends Body,
> = AWSS3WithoutCompanion &
  AWSS3NonMultipartWithoutCompanionMandatory<M, B> & {
    shouldUseMultipart: false
    createMultipartUpload?: never
    listParts?: never
    signPart?: never
    abortMultipartUpload?: never
    completeMultipartUpload?: never
  }

type AWSS3MultipartWithoutCompanionMandatory<M extends Meta, B extends Body> = {
  getChunkSize?: (file: UppyFile<M, B>) => number
  createMultipartUpload: (file: UppyFile<M, B>) => MaybePromise<UploadResult>
  listParts: (
    file: UppyFile<M, B>,
    opts: UploadResultWithSignal,
  ) => MaybePromise<AwsS3Part[]>
  abortMultipartUpload: (
    file: UppyFile<M, B>,
    opts: UploadResultWithSignal,
  ) => MaybePromise<void>
  completeMultipartUpload: (
    file: UppyFile<M, B>,
    opts: {
      uploadId: string
      key: string
      parts: AwsS3Part[]
      signal: AbortSignal
    },
  ) => MaybePromise<{ location?: string }>
} & (
  | {
      signPart: (
        file: UppyFile<M, B>,
        opts: SignPartOptions,
      ) => MaybePromise<AwsS3UploadParameters>
    }
  | {
      /** @deprecated Use signPart instead */
      prepareUploadParts: (
        file: UppyFile<M, B>,
        partData: {
          uploadId: string
          key: string
          parts: [{ number: number; chunk: Blob }]
        },
      ) => MaybePromise<{
        presignedUrls: Record<number, string>
        headers?: Record<number, Record<string, string>>
      }>
    }
)

type AWSS3MultipartWithoutCompanion<
  M extends Meta,
  B extends Body,
> = AWSS3WithoutCompanion &
  AWSS3MultipartWithoutCompanionMandatory<M, B> & {
    shouldUseMultipart?: true
    getUploadParameters?: never
  }

type AWSS3MultipartWithCompanion<
  M extends Meta,
  B extends Body,
> = AWSS3WithCompanion &
  Partial<AWSS3MultipartWithoutCompanionMandatory<M, B>> & {
    shouldUseMultipart?: true
    getUploadParameters?: never
  }

type AWSS3MaybeMultipartWithCompanion<
  M extends Meta,
  B extends Body,
> = AWSS3WithCompanion &
  Partial<AWSS3MultipartWithoutCompanionMandatory<M, B>> &
  AWSS3NonMultipartWithCompanionMandatory & {
    shouldUseMultipart: (file: UppyFile<M, B>) => boolean
  }

type AWSS3MaybeMultipartWithoutCompanion<
  M extends Meta,
  B extends Body,
> = AWSS3WithoutCompanion &
  AWSS3MultipartWithoutCompanionMandatory<M, B> &
  AWSS3NonMultipartWithoutCompanionMandatory<M, B> & {
    shouldUseMultipart: (file: UppyFile<M, B>) => boolean
  }

type RequestClientOptions = Partial<
  ConstructorParameters<typeof RequestClient<any, any>>[1]
>

interface _AwsS3MultipartOptions extends PluginOpts, RequestClientOptions {
  allowedMetaFields?: string[] | null
  limit?: number
  retryDelays?: number[] | null
}

export type AwsS3MultipartOptions<
  M extends Meta,
  B extends Body,
> = _AwsS3MultipartOptions &
  (
    | AWSS3NonMultipartWithCompanion
    | AWSS3NonMultipartWithoutCompanion<M, B>
    | AWSS3MultipartWithCompanion<M, B>
    | AWSS3MultipartWithoutCompanion<M, B>
    | AWSS3MaybeMultipartWithCompanion<M, B>
    | AWSS3MaybeMultipartWithoutCompanion<M, B>
  )

const defaultOptions = {
  // TODO: null here means “include all”, [] means include none.
  // This is inconsistent with @uppy/aws-s3 and @uppy/transloadit
  allowedMetaFields: null,
  limit: 6,
  getTemporarySecurityCredentials: false as any,
  shouldUseMultipart: (file: UppyFile<any, any>) => file.size !== 0, // TODO: Switch default to:
  // eslint-disable-next-line no-bitwise
  // shouldUseMultipart: (file) => file.size >> 10 >> 10 > 100,
  retryDelays: [0, 1000, 3000, 5000],
  companionHeaders: {},
} satisfies Partial<AwsS3MultipartOptions<any, any>>

export default class AwsS3Multipart<
  M extends Meta,
  B extends Body,
> extends BasePlugin<
  DefinePluginOpts<
    AwsS3MultipartOptions<M, B>,
    | keyof typeof defaultOptions
    // We also have a few dynamic options defined below:
    | 'createMultipartUpload'
    | 'listParts'
    | 'abortMultipartUpload'
    | 'completeMultipartUpload'
    // | 'uploadPartBytes'
    | 'getUploadParameters'
    // | 'signPart'
  >,
  M,
  B
> {
  static VERSION = packageJson.version

  #companionCommunicationQueue

  #client: RequestClient<M, B>

  protected requests: any

  protected uploaderEvents: Record<string, EventManager<M, B> | null>

  protected uploaders: Record<string, MultipartUploader<M, B> | null>

  protected uploaderSockets: Record<string, never>

  constructor(uppy: Uppy<M, B>, opts: AwsS3MultipartOptions<M, B>) {
    super(uppy, {
      ...defaultOptions,
      uploadPartBytes: AwsS3Multipart.uploadPartBytes,
      ...opts,
    })
    this.type = 'uploader'
    this.id = this.opts.id || 'AwsS3Multipart'
    // @ts-expect-error TODO: remove unused
    this.title = 'AWS S3 Multipart'
    // TODO: only initiate `RequestClient` is `companionUrl` is defined.
    this.#client = new RequestClient(uppy, opts as any)

    const dynamicDefaultOptions = {
      createMultipartUpload: this.createMultipartUpload.bind(this),
      listParts: this.listParts.bind(this),
      abortMultipartUpload: this.abortMultipartUpload.bind(this),
      completeMultipartUpload: this.completeMultipartUpload.bind(this),
      signPart: opts?.getTemporarySecurityCredentials
        ? this.createSignedURL.bind(this)
        : this.signPart.bind(this),
      getUploadParameters: opts?.getTemporarySecurityCredentials
        ? this.createSignedURL.bind(this)
        : this.getUploadParameters.bind(this),
    } satisfies Partial<AwsS3MultipartOptions<M, B>>

    this.opts = { ...dynamicDefaultOptions, ...this.opts }
    if (opts?.prepareUploadParts != null && opts.signPart == null) {
      this.opts.signPart = async (
        file: UppyFile<M, B>,
        { uploadId, key, partNumber, body, signal }: SignPartOptions,
      ) => {
        const { presignedUrls, headers } = await opts.prepareUploadParts(file, {
          uploadId,
          key,
          parts: [{ number: partNumber, chunk: body }],
          signal,
        })
        return {
          url: presignedUrls?.[partNumber],
          headers: headers?.[partNumber],
        }
      }
    }

    /**
     * Simultaneous upload limiting is shared across all uploads with this plugin.
     *
     * @type {RateLimitedQueue}
     */
    this.requests =
      (this.opts as any).rateLimitedQueue ??
      new RateLimitedQueue(this.opts.limit)
    this.#companionCommunicationQueue = new HTTPCommunicationQueue(
      this.requests,
      this.opts,
      this.#setS3MultipartState,
      this.#getFile,
    )

    this.uploaders = Object.create(null)
    this.uploaderEvents = Object.create(null)
    this.uploaderSockets = Object.create(null)
  }

  private [Symbol.for('uppy test: getClient')]() {
    return this.#client
  }

  setOptions(newOptions: Partial<AwsS3MultipartOptions<M, B>>): void {
    this.#companionCommunicationQueue.setOptions(newOptions)
    super.setOptions(newOptions)
    this.#setCompanionHeaders()
  }

  /**
   * Clean up all references for a file's upload: the MultipartUploader instance,
   * any events related to the file, and the Companion WebSocket connection.
   *
   * Set `opts.abort` to tell S3 that the multipart upload is cancelled and must be removed.
   * This should be done when the user cancels the upload, not when the upload is completed or errored.
   */
  resetUploaderReferences(fileID, opts?: { abort: boolean }) {
    if (this.uploaders[fileID]) {
      this.uploaders[fileID]!.abort({ really: opts?.abort || false })
      this.uploaders[fileID] = null
    }
    if (this.uploaderEvents[fileID]) {
      this.uploaderEvents[fileID]!.remove()
      this.uploaderEvents[fileID] = null
    }
    if (this.uploaderSockets[fileID]) {
      // @ts-expect-error TODO: remove this block in the next major
      this.uploaderSockets[fileID].close()
      // @ts-expect-error TODO: remove this block in the next major
      this.uploaderSockets[fileID] = null
    }
  }

  // TODO: make this a private method in the next major
  assertHost(method: string): void {
    if (!this.opts.companionUrl) {
      throw new Error(
        `Expected a \`companionUrl\` option containing a Companion address, or if you are not using Companion, a custom \`${method}\` implementation.`,
      )
    }
  }

  createMultipartUpload(
    file: UppyFile<M, B>,
    signal?: AbortSignal,
  ): Promise<UploadResult> {
    this.assertHost('createMultipartUpload')
    throwIfAborted(signal)

    const metadata = getAllowedMetadata({
      meta: file.meta,
      allowedMetaFields: this.opts.allowedMetaFields,
    })

    return this.#client
      .post<UploadResult>(
        's3/multipart',
        {
          filename: file.name,
          type: file.type,
          metadata,
        },
        { signal },
      )
      .then(assertServerError)
  }

  listParts(
    file: UppyFile<M, B>,
    { key, uploadId, signal }: UploadResultWithSignal,
    oldSignal?: AbortSignal,
  ): Promise<AwsS3Part[]> {
    signal ??= oldSignal // eslint-disable-line no-param-reassign
    this.assertHost('listParts')
    throwIfAborted(signal)

    const filename = encodeURIComponent(key)
    return this.#client
      .get<AwsS3Part[]>(`s3/multipart/${uploadId}?key=${filename}`, { signal })
      .then(assertServerError)
  }

  completeMultipartUpload(
    file: UppyFile<M, B>,
    { key, uploadId, parts, signal }: MultipartUploadResultWithSignal,
    oldSignal?: AbortSignal,
  ): Promise<{
    location: string
  }> {
    signal ??= oldSignal // eslint-disable-line no-param-reassign
    this.assertHost('completeMultipartUpload')
    throwIfAborted(signal)

    const filename = encodeURIComponent(key)
    const uploadIdEnc = encodeURIComponent(uploadId)
    return this.#client
      .post<{
        location: string
      }>(
        `s3/multipart/${uploadIdEnc}/complete?key=${filename}`,
        { parts },
        { signal },
      )
      .then(assertServerError)
  }

  #cachedTemporaryCredentials: MaybePromise<AwsS3STSResponse>

  async #getTemporarySecurityCredentials(options?: RequestOptions) {
    throwIfAborted(options?.signal)

    if (this.#cachedTemporaryCredentials == null) {
      // We do not await it just yet, so concurrent calls do not try to override it:
      if (this.opts.getTemporarySecurityCredentials === true) {
        this.assertHost('getTemporarySecurityCredentials')
        this.#cachedTemporaryCredentials = this.#client
          .get<AwsS3STSResponse>('s3/sts', options)
          .then(assertServerError)
      } else {
        this.#cachedTemporaryCredentials =
          this.opts.getTemporarySecurityCredentials(options)
      }
      this.#cachedTemporaryCredentials = await this.#cachedTemporaryCredentials
      setTimeout(
        () => {
          // At half the time left before expiration, we clear the cache. That's
          // an arbitrary tradeoff to limit the number of requests made to the
          // remote while limiting the risk of using an expired token in case the
          // clocks are not exactly synced.
          // The HTTP cache should be configured to ensure a client doesn't request
          // more tokens than it needs, but this timeout provides a second layer of
          // security in case the HTTP cache is disabled or misconfigured.
          this.#cachedTemporaryCredentials = null as any
        },
        (getExpiry(this.#cachedTemporaryCredentials.credentials) || 0) * 500,
      )
    }

    return this.#cachedTemporaryCredentials
  }

  async createSignedURL(
    file: UppyFile<M, B>,
    options: SignPartOptions,
  ): Promise<AwsS3UploadParameters> {
    const data = await this.#getTemporarySecurityCredentials(options)
    const expires = getExpiry(data.credentials) || 604_800 // 604 800 is the max value accepted by AWS.

    const { uploadId, key, partNumber } = options

    // Return an object in the correct shape.
    return {
      method: 'PUT',
      expires,
      fields: {},
      url: `${await createSignedURL({
        accountKey: data.credentials.AccessKeyId,
        accountSecret: data.credentials.SecretAccessKey,
        sessionToken: data.credentials.SessionToken,
        expires,
        bucketName: data.bucket,
        Region: data.region,
        Key: key ?? `${crypto.randomUUID()}-${file.name}`,
        uploadId,
        partNumber,
      })}`,
      // Provide content type header required by S3
      headers: {
        'Content-Type': file.type as string,
      },
    }
  }

  signPart(
    file: UppyFile<M, B>,
    { uploadId, key, partNumber, signal }: SignPartOptions,
  ): Promise<AwsS3UploadParameters> {
    this.assertHost('signPart')
    throwIfAborted(signal)

    if (uploadId == null || key == null || partNumber == null) {
      throw new Error(
        'Cannot sign without a key, an uploadId, and a partNumber',
      )
    }

    const filename = encodeURIComponent(key)
    return this.#client
      .get<AwsS3UploadParameters>(
        `s3/multipart/${uploadId}/${partNumber}?key=${filename}`,
        { signal },
      )
      .then(assertServerError)
  }

  abortMultipartUpload(
    file: UppyFile<M, B>,
    { key, uploadId, signal }: UploadResultWithSignal,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    oldSignal?: AbortSignal, // TODO: remove in next major
  ): Promise<Record<string, never>> {
    signal ??= oldSignal // eslint-disable-line no-param-reassign
    this.assertHost('abortMultipartUpload')

    const filename = encodeURIComponent(key)
    const uploadIdEnc = encodeURIComponent(uploadId)
    return this.#client
      .delete<Record<string, never>>(
        `s3/multipart/${uploadIdEnc}?key=${filename}`,
        undefined,
        {
          signal,
        },
      )
      .then(assertServerError)
  }

  getUploadParameters(
    file: UppyFile<M, B>,
    options: RequestOptions,
  ): Promise<AwsS3UploadParameters> {
    const { meta } = file
    const { type, name: filename } = meta
    const metadata = getAllowedMetadata({
      meta,
      allowedMetaFields: this.opts.allowedMetaFields,
      querify: true,
    })

    const query = new URLSearchParams({ filename, type, ...metadata } as Record<
      string,
      string
    >)

    return this.#client.get(`s3/params?${query}`, options)
  }

  static async uploadPartBytes({
    signature: { url, expires, headers, method = 'PUT' },
    body,
    size = (body as Blob).size,
    onProgress,
    onComplete,
    signal,
  }: {
    signature: AwsS3UploadParameters
    body: FormData | Blob
    size?: number
    onProgress: any
    onComplete: any
    signal: AbortSignal
  }): Promise<{
    ETag: string
    location?: string
  }> {
    throwIfAborted(signal)

    if (url == null) {
      throw new Error('Cannot upload to an undefined URL')
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open(method, url, true)
      if (headers) {
        Object.keys(headers).forEach((key) => {
          xhr.setRequestHeader(key, headers[key])
        })
      }
      xhr.responseType = 'text'
      if (typeof expires === 'number') {
        xhr.timeout = expires * 1000
      }

      function onabort() {
        xhr.abort()
      }
      function cleanup() {
        signal.removeEventListener('abort', onabort)
      }
      signal.addEventListener('abort', onabort)

      xhr.upload.addEventListener('progress', (ev) => {
        onProgress(ev)
      })

      xhr.addEventListener('abort', () => {
        cleanup()

        reject(createAbortError())
      })

      xhr.addEventListener('timeout', () => {
        cleanup()

        const error = new Error('Request has expired')
        ;(error as any).source = { status: 403 }
        reject(error)
      })
      xhr.addEventListener('load', (ev) => {
        cleanup()

        if (
          xhr.status === 403 &&
          xhr.responseText.includes('<Message>Request has expired</Message>')
        ) {
          const error = new Error('Request has expired')
          ;(error as any).source = xhr
          reject(error)
          return
        }
        if (xhr.status < 200 || xhr.status >= 300) {
          const error = new Error('Non 2xx')
          ;(error as any).source = xhr
          reject(error)
          return
        }

        // todo make a proper onProgress API (breaking change)
        onProgress?.({ loaded: size, lengthComputable: true })

        // NOTE This must be allowed by CORS.
        const etag = xhr.getResponseHeader('ETag')
        const location = xhr.getResponseHeader('Location')

        if (method.toUpperCase() === 'POST' && location === null) {
          // Not being able to read the Location header is not a fatal error.
          // eslint-disable-next-line no-console
          console.warn(
            'AwsS3/Multipart: Could not read the Location header. This likely means CORS is not configured correctly on the S3 Bucket. See https://uppy.io/docs/aws-s3-multipart#S3-Bucket-Configuration for instructions.',
          )
        }
        if (etag === null) {
          reject(
            new Error(
              'AwsS3/Multipart: Could not read the ETag header. This likely means CORS is not configured correctly on the S3 Bucket. See https://uppy.io/docs/aws-s3-multipart#S3-Bucket-Configuration for instructions.',
            ),
          )
          return
        }

        onComplete?.(etag)
        resolve({
          ETag: etag,
          ...(location ? { location } : undefined),
        })
      })

      xhr.addEventListener('error', (ev) => {
        cleanup()

        const error = new Error('Unknown error')
        ;(error as any).source = ev.target
        reject(error)
      })

      xhr.send(body)
    })
  }

  #setS3MultipartState = (file: UppyFile<M, B>, { key, uploadId }) => {
    const cFile = this.uppy.getFile(file.id)
    if (cFile == null) {
      // file was removed from store
      return
    }

    this.uppy.setFileState(file.id, {
      s3Multipart: {
        ...cFile.s3Multipart,
        key,
        uploadId,
      },
    })
  }

  #getFile = (file: UppyFile<M, B>) => {
    return this.uppy.getFile(file.id) || file
  }

  #uploadLocalFile(file: UppyFile<M, B>) {
    return new Promise<void | string>((resolve, reject) => {
      const onProgress = (bytesUploaded: number, bytesTotal: number) => {
        this.uppy.emit('upload-progress', file, {
          // @ts-expect-error TODO: figure out if we need this
          uploader: this,
          bytesUploaded,
          bytesTotal,
        })
      }

      const onError = (err: Error) => {
        this.uppy.log(err)
        this.uppy.emit('upload-error', file, err)

        this.resetUploaderReferences(file.id)
        reject(err)
      }

      const onSuccess = (result: B & { location: string }) => {
        const uploadResp = {
          body: {
            ...result,
          },
          status: 200,
          uploadURL: result.location,
        }

        this.resetUploaderReferences(file.id)

        this.uppy.emit('upload-success', this.#getFile(file), uploadResp)

        if (result.location) {
          this.uppy.log(`Download ${file.name} from ${result.location}`)
        }

        resolve()
      }

      const upload = new MultipartUploader<M, B>(file.data, {
        // .bind to pass the file object to each handler.
        companionComm: this.#companionCommunicationQueue,

        log: (...args: Parameters<Uppy<M, B>['log']>) => this.uppy.log(...args),
        getChunkSize: this.opts.getChunkSize
          ? this.opts.getChunkSize.bind(this)
          : null,

        onProgress,
        onError,
        onSuccess,
        onPartComplete: (part) => {
          this.uppy.emit(
            's3-multipart:part-uploaded',
            this.#getFile(file),
            part,
          )
        },

        file,
        shouldUseMultipart: this.opts.shouldUseMultipart,

        ...file.s3Multipart,
      })

      this.uploaders[file.id] = upload
      const eventManager = new EventManager(this.uppy)
      this.uploaderEvents[file.id] = eventManager

      eventManager.onFileRemove(file.id, (removed) => {
        upload.abort()
        this.resetUploaderReferences(file.id, { abort: true })
        resolve(`upload ${removed} was removed`)
      })

      eventManager.onCancelAll(file.id, (options) => {
        if (options?.reason === 'user') {
          upload.abort()
          this.resetUploaderReferences(file.id, { abort: true })
        }
        resolve(`upload ${file.id} was canceled`)
      })

      eventManager.onFilePause(file.id, (isPaused) => {
        if (isPaused) {
          upload.pause()
        } else {
          upload.start()
        }
      })

      eventManager.onPauseAll(file.id, () => {
        upload.pause()
      })

      eventManager.onResumeAll(file.id, () => {
        upload.start()
      })

      upload.start()
    })
  }

  // eslint-disable-next-line class-methods-use-this
  #getCompanionClientArgs(file: UppyFile<M, B>) {
    return {
      ...file.remote?.body,
      protocol: 's3-multipart',
      size: file.data.size,
      metadata: file.meta,
    }
  }

  #upload = async (fileIDs: string[]) => {
    if (fileIDs.length === 0) return undefined

    const files = this.uppy.getFilesByIds(fileIDs)
    const filesFiltered = filterNonFailedFiles(files)
    const filesToEmit = filterFilesToEmitUploadStarted(filesFiltered)

    this.uppy.emit('upload-start', filesToEmit)

    const promises = filesFiltered.map((file) => {
      if (file.isRemote) {
        const getQueue = () => this.requests
        this.#setResumableUploadsCapability(false)
        const controller = new AbortController()

        const removedHandler = (removedFile: UppyFile<M, B>) => {
          if (removedFile.id === file.id) controller.abort()
        }
        this.uppy.on('file-removed', removedHandler)

        const uploadPromise = this.uppy
          .getRequestClientForFile<RequestClient<M, B>>(file)
          .uploadRemoteFile(file, this.#getCompanionClientArgs(file), {
            signal: controller.signal,
            getQueue,
          })

        this.requests.wrapSyncFunction(
          () => {
            this.uppy.off('file-removed', removedHandler)
          },
          { priority: -1 },
        )()

        return uploadPromise
      }

      return this.#uploadLocalFile(file)
    })

    const upload = await Promise.all(promises)
    // After the upload is done, another upload may happen with only local files.
    // We reset the capability so that the next upload can use resumable uploads.
    this.#setResumableUploadsCapability(true)
    return upload
  }

  #setCompanionHeaders = () => {
    this.#client.setCompanionHeaders(this.opts.companionHeaders)
  }

  #setResumableUploadsCapability = (boolean: boolean) => {
    const { capabilities } = this.uppy.getState()
    this.uppy.setState({
      capabilities: {
        ...capabilities,
        resumableUploads: boolean,
      },
    })
  }

  #resetResumableCapability = () => {
    this.#setResumableUploadsCapability(true)
  }

  install(): void {
    this.#setResumableUploadsCapability(true)
    this.uppy.addPreProcessor(this.#setCompanionHeaders)
    this.uppy.addUploader(this.#upload)
    this.uppy.on('cancel-all', this.#resetResumableCapability)
  }

  uninstall(): void {
    this.uppy.removePreProcessor(this.#setCompanionHeaders)
    this.uppy.removeUploader(this.#upload)
    this.uppy.off('cancel-all', this.#resetResumableCapability)
  }
}
