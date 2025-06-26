import { RequestClient } from '@uppy/companion-client'
import {
  BasePlugin,
  type DefinePluginOpts,
  type PluginOpts,
  type Uppy,
} from '@uppy/core'
import EventManager from '@uppy/core/lib/EventManager.js'
import { createAbortError } from '@uppy/utils/lib/AbortController'
import type { RequestOptions } from '@uppy/utils/lib/CompanionClientProvider'
import {
  filterFilesToEmitUploadStarted,
  filterNonFailedFiles,
} from '@uppy/utils/lib/fileFilters'
import getAllowedMetaFields from '@uppy/utils/lib/getAllowedMetaFields'
import { RateLimitedQueue } from '@uppy/utils/lib/RateLimitedQueue'
import type { Body, Meta, UppyFile } from '@uppy/utils/lib/UppyFile'
import packageJson from '../package.json' with { type: 'json' }
import createSignedURL from './createSignedURL.js'
import { HTTPCommunicationQueue } from './HTTPCommunicationQueue.js'
import MultipartUploader from './MultipartUploader.js'
import type {
  MultipartUploadResultWithSignal,
  UploadPartBytesResult,
  UploadResult,
  UploadResultWithSignal,
} from './utils.js'
import { throwIfAborted } from './utils.js'

interface MultipartFile<M extends Meta, B extends Body> extends UppyFile<M, B> {
  s3Multipart: UploadResult
}

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

function getAllowedMetadata<M extends Record<string, any>>({
  meta,
  allowedMetaFields,
  querify = false,
}: {
  meta: M
  allowedMetaFields?: string[] | null
  querify?: boolean
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
  endpoint: ConstructorParameters<
    typeof RequestClient<any, any>
  >[1]['companionUrl']
  headers?: ConstructorParameters<
    typeof RequestClient<any, any>
  >[1]['companionHeaders']
  cookiesRule?: ConstructorParameters<
    typeof RequestClient<any, any>
  >[1]['companionCookiesRule']
  getTemporarySecurityCredentials?: true
}
type AWSS3WithoutCompanion = {
  getTemporarySecurityCredentials?: (options?: {
    signal?: AbortSignal
  }) => MaybePromise<AwsS3STSResponse>
  uploadPartBytes?: (options: {
    signature: AwsS3UploadParameters
    body: FormData | Blob
    size?: number
    onProgress: any
    onComplete: any
    signal?: AbortSignal
  }) => Promise<UploadPartBytesResult>
}

// biome-ignore lint/complexity/noBannedTypes: ...
type AWSS3NonMultipartWithCompanionMandatory = {
  // No related options
}

type AWSS3NonMultipartWithoutCompanionMandatory<
  M extends Meta,
  B extends Body,
> = {
  getUploadParameters: (
    file: UppyFile<M, B>,
    options: RequestOptions,
  ) => MaybePromise<AwsS3UploadParameters>
}
type AWSS3NonMultipartWithCompanion = AWSS3WithCompanion &
  AWSS3NonMultipartWithCompanionMandatory & {
    shouldUseMultipart: false
  }

type AWSS3NonMultipartWithoutCompanion<
  M extends Meta,
  B extends Body,
> = AWSS3WithoutCompanion &
  AWSS3NonMultipartWithoutCompanionMandatory<M, B> & {
    shouldUseMultipart: false
  }

type AWSS3MultipartWithoutCompanionMandatorySignPart<
  M extends Meta,
  B extends Body,
> = {
  signPart: (
    file: UppyFile<M, B>,
    opts: SignPartOptions,
  ) => MaybePromise<AwsS3UploadParameters>
}
type AWSS3MultipartWithoutCompanionMandatory<M extends Meta, B extends Body> = {
  getChunkSize?: (file: { size: number }) => number
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
} & AWSS3MultipartWithoutCompanionMandatorySignPart<M, B>

type AWSS3MultipartWithoutCompanion<
  M extends Meta,
  B extends Body,
> = AWSS3WithoutCompanion &
  AWSS3MultipartWithoutCompanionMandatory<M, B> & {
    shouldUseMultipart?: true
  }

type AWSS3MultipartWithCompanion<
  M extends Meta,
  B extends Body,
> = AWSS3WithCompanion &
  Partial<AWSS3MultipartWithoutCompanionMandatory<M, B>> & {
    shouldUseMultipart?: true
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

interface _AwsS3MultipartOptions extends PluginOpts {
  allowedMetaFields?: string[] | boolean
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

export type { AwsS3MultipartOptions as AwsS3Options }

const defaultOptions = {
  allowedMetaFields: true,
  limit: 6,
  getTemporarySecurityCredentials: false as any,
  shouldUseMultipart: ((file: UppyFile<any, any>) =>
    (file.size || 0) > 100 * 1024 * 1024) as any as true,
  retryDelays: [0, 1000, 3000, 5000],
} satisfies Partial<AwsS3MultipartOptions<any, any>>

export type { AwsBody } from './utils.js'

export default class AwsS3Multipart<
  M extends Meta,
  B extends Body,
> extends BasePlugin<
  DefinePluginOpts<AwsS3MultipartOptions<M, B>, keyof typeof defaultOptions> &
    // We also have a few dynamic options defined below:
    Pick<
      AWSS3MultipartWithoutCompanionMandatory<M, B>,
      | 'getChunkSize'
      | 'createMultipartUpload'
      | 'listParts'
      | 'abortMultipartUpload'
      | 'completeMultipartUpload'
    > &
    Required<Pick<AWSS3WithoutCompanion, 'uploadPartBytes'>> &
    Partial<AWSS3WithCompanion> &
    AWSS3MultipartWithoutCompanionMandatorySignPart<M, B> &
    AWSS3NonMultipartWithoutCompanionMandatory<M, B>,
  M,
  B
> {
  static VERSION = packageJson.version

  #companionCommunicationQueue

  #client!: RequestClient<M, B>

  protected requests: any

  protected uploaderEvents: Record<string, EventManager<M, B> | null>

  protected uploaders: Record<string, MultipartUploader<M, B> | null>

  constructor(uppy: Uppy<M, B>, opts?: AwsS3MultipartOptions<M, B>) {
    super(uppy, {
      ...defaultOptions,
      uploadPartBytes: AwsS3Multipart.uploadPartBytes,
      createMultipartUpload: null as any,
      listParts: null as any,
      abortMultipartUpload: null as any,
      completeMultipartUpload: null as any,
      signPart: null as any,
      getUploadParameters: null as any,
      ...opts,
    })
    // We need the `as any` here because of the dynamic default options.
    this.type = 'uploader'
    this.id = this.opts.id || 'AwsS3Multipart'
    this.#setClient(opts)

    const dynamicDefaultOptions = {
      createMultipartUpload: this.createMultipartUpload,
      listParts: this.listParts,
      abortMultipartUpload: this.abortMultipartUpload,
      completeMultipartUpload: this.completeMultipartUpload,
      signPart: opts?.getTemporarySecurityCredentials
        ? this.createSignedURL
        : this.signPart,
      getUploadParameters: opts?.getTemporarySecurityCredentials
        ? (this.createSignedURL as any)
        : this.getUploadParameters,
    } satisfies Partial<AwsS3MultipartOptions<M, B>>

    for (const key of Object.keys(dynamicDefaultOptions)) {
      if (this.opts[key as keyof typeof dynamicDefaultOptions] == null) {
        this.opts[key as keyof typeof dynamicDefaultOptions] =
          dynamicDefaultOptions[key as keyof typeof dynamicDefaultOptions].bind(
            this,
          )
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
  }

  private [Symbol.for('uppy test: getClient')]() {
    return this.#client
  }

  #setClient(opts?: Partial<AwsS3MultipartOptions<M, B>>) {
    if (
      opts == null ||
      !(
        'endpoint' in opts ||
        'companionUrl' in opts ||
        'headers' in opts ||
        'companionHeaders' in opts ||
        'cookiesRule' in opts ||
        'companionCookiesRule' in opts
      )
    )
      return
    if ('companionUrl' in opts && !('endpoint' in opts)) {
      this.uppy.log(
        '`companionUrl` option has been removed in @uppy/aws-s3, use `endpoint` instead.',
        'warning',
      )
    }
    if ('companionHeaders' in opts && !('headers' in opts)) {
      this.uppy.log(
        '`companionHeaders` option has been removed in @uppy/aws-s3, use `headers` instead.',
        'warning',
      )
    }
    if ('companionCookiesRule' in opts && !('cookiesRule' in opts)) {
      this.uppy.log(
        '`companionCookiesRule` option has been removed in @uppy/aws-s3, use `cookiesRule` instead.',
        'warning',
      )
    }
    if ('endpoint' in opts) {
      this.#client = new RequestClient(this.uppy, {
        pluginId: this.id,
        provider: 'AWS',
        companionUrl: this.opts.endpoint!,
        companionHeaders: this.opts.headers,
        companionCookiesRule: this.opts.cookiesRule,
      })
    } else {
      if ('headers' in opts) {
        this.#setCompanionHeaders()
      }
      if ('cookiesRule' in opts) {
        this.#client.opts.companionCookiesRule = opts.cookiesRule
      }
    }
  }

  setOptions(newOptions: Partial<AwsS3MultipartOptions<M, B>>): void {
    this.#companionCommunicationQueue.setOptions(newOptions)
    super.setOptions(newOptions as any)
    this.#setClient(newOptions)
  }

  /**
   * Clean up all references for a file's upload: the MultipartUploader instance,
   * any events related to the file, and the Companion WebSocket connection.
   *
   * Set `opts.abort` to tell S3 that the multipart upload is cancelled and must be removed.
   * This should be done when the user cancels the upload, not when the upload is completed or errored.
   */
  resetUploaderReferences(fileID: string, opts?: { abort: boolean }): void {
    if (this.uploaders[fileID]) {
      this.uploaders[fileID]!.abort({ really: opts?.abort || false })
      this.uploaders[fileID] = null
    }
    if (this.uploaderEvents[fileID]) {
      this.uploaderEvents[fileID]!.remove()
      this.uploaderEvents[fileID] = null
    }
  }

  #assertHost(method: string): void {
    if (!this.#client) {
      throw new Error(
        `Expected a \`endpoint\` option containing a URL, or if you are not using Companion, a custom \`${method}\` implementation.`,
      )
    }
  }

  createMultipartUpload(
    file: UppyFile<M, B>,
    signal?: AbortSignal,
  ): Promise<UploadResult> {
    this.#assertHost('createMultipartUpload')
    throwIfAborted(signal)

    const allowedMetaFields = getAllowedMetaFields(
      this.opts.allowedMetaFields,
      file.meta,
    )
    const metadata = getAllowedMetadata({ meta: file.meta, allowedMetaFields })

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
    signal ??= oldSignal
    this.#assertHost('listParts')
    throwIfAborted(signal)

    const filename = encodeURIComponent(key)
    return this.#client
      .get<AwsS3Part[]>(
        `s3/multipart/${encodeURIComponent(uploadId!)}?key=${filename}`,
        { signal },
      )
      .then(assertServerError)
  }

  completeMultipartUpload(
    file: UppyFile<M, B>,
    { key, uploadId, parts, signal }: MultipartUploadResultWithSignal,
    oldSignal?: AbortSignal,
  ): Promise<B> {
    signal ??= oldSignal
    this.#assertHost('completeMultipartUpload')
    throwIfAborted(signal)

    const filename = encodeURIComponent(key)
    const uploadIdEnc = encodeURIComponent(uploadId!)
    return this.#client
      .post<B>(
        `s3/multipart/${uploadIdEnc}/complete?key=${filename}`,
        { parts: parts.map(({ ETag, PartNumber }) => ({ ETag, PartNumber })) },
        { signal },
      )
      .then(assertServerError)
  }

  #cachedTemporaryCredentials?: MaybePromise<AwsS3STSResponse>

  async #getTemporarySecurityCredentials(options?: RequestOptions) {
    throwIfAborted(options?.signal)

    if (this.#cachedTemporaryCredentials == null) {
      const { getTemporarySecurityCredentials } = this.opts
      // We do not await it just yet, so concurrent calls do not try to override it:
      if (getTemporarySecurityCredentials === true) {
        this.#assertHost('getTemporarySecurityCredentials')
        this.#cachedTemporaryCredentials = this.#client
          .get<AwsS3STSResponse>('s3/sts', options)
          .then(assertServerError)
      } else {
        this.#cachedTemporaryCredentials =
          (getTemporarySecurityCredentials as AWSS3WithoutCompanion['getTemporarySecurityCredentials'])!(
            options,
          )
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
    this.#assertHost('signPart')
    throwIfAborted(signal)

    if (uploadId == null || key == null || partNumber == null) {
      throw new Error(
        'Cannot sign without a key, an uploadId, and a partNumber',
      )
    }

    const filename = encodeURIComponent(key)
    return this.#client
      .get<AwsS3UploadParameters>(
        `s3/multipart/${encodeURIComponent(uploadId)}/${partNumber}?key=${filename}`,
        { signal },
      )
      .then(assertServerError)
  }

  abortMultipartUpload(
    file: UppyFile<M, B>,
    { key, uploadId, signal }: UploadResultWithSignal,
  ): Promise<void> {
    this.#assertHost('abortMultipartUpload')

    const filename = encodeURIComponent(key)
    const uploadIdEnc = encodeURIComponent(uploadId!)
    return this.#client
      .delete<void>(`s3/multipart/${uploadIdEnc}?key=${filename}`, undefined, {
        signal,
      })
      .then(assertServerError)
  }

  getUploadParameters(
    file: UppyFile<M, B>,
    options: RequestOptions,
  ): Promise<AwsS3UploadParameters> {
    this.#assertHost('getUploadParameters')
    const { meta } = file
    const { type, name: filename } = meta
    const allowedMetaFields = getAllowedMetaFields(
      this.opts.allowedMetaFields,
      file.meta,
    )
    const metadata = getAllowedMetadata({
      meta,
      allowedMetaFields,
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
    signal?: AbortSignal
  }): Promise<UploadPartBytesResult> {
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
        signal?.removeEventListener('abort', onabort)
      }
      signal?.addEventListener('abort', onabort)

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
      xhr.addEventListener('load', () => {
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

        onProgress?.({ loaded: size, lengthComputable: true })

        // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/getAllResponseHeaders#examples
        const arr = xhr
          .getAllResponseHeaders()
          .trim()
          .split(/[\r\n]+/)
        // @ts-expect-error null is allowed to avoid inherited properties
        const headersMap: Record<string, string> = { __proto__: null }
        for (const line of arr) {
          const parts = line.split(': ')
          const header = parts.shift()!
          const value = parts.join(': ')
          headersMap[header] = value
        }
        const { etag, location } = headersMap

        // More info bucket settings when this is not present:
        // https://github.com/transloadit/uppy/issues/5388#issuecomment-2464885562
        if (method.toUpperCase() === 'POST' && location == null) {
          // Not being able to read the Location header is not a fatal error.
          console.error(
            '@uppy/aws-s3: Could not read the Location header. This likely means CORS is not configured correctly on the S3 Bucket. See https://uppy.io/docs/aws-s3/#setting-up-your-s3-bucket',
          )
        }
        if (etag == null) {
          console.error(
            '@uppy/aws-s3: Could not read the ETag header. This likely means CORS is not configured correctly on the S3 Bucket. See https://uppy.io/docs/aws-s3/#setting-up-your-s3-bucket',
          )
          return
        }

        onComplete?.(etag)
        resolve({
          ...headersMap,
          ETag: etag, // keep capitalised ETag for backwards compatiblity
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

  #setS3MultipartState = (
    file: UppyFile<M, B>,
    { key, uploadId }: UploadResult,
  ) => {
    const cFile = this.uppy.getFile(file.id)
    if (cFile == null) {
      // file was removed from store
      return
    }

    this.uppy.setFileState(file.id, {
      s3Multipart: {
        ...(cFile as MultipartFile<M, B>).s3Multipart,
        key,
        uploadId,
      },
    } as Partial<MultipartFile<M, B>>)
  }

  #getFile = (file: UppyFile<M, B>) => {
    return this.uppy.getFile(file.id) || file
  }

  #uploadLocalFile(file: UppyFile<M, B>) {
    return new Promise<undefined | string>((resolve, reject) => {
      const onProgress = (bytesUploaded: number, bytesTotal: number) => {
        const latestFile = this.uppy.getFile(file.id)
        this.uppy.emit('upload-progress', latestFile, {
          uploadStarted: latestFile.progress.uploadStarted ?? 0,
          bytesUploaded,
          bytesTotal,
        })
      }

      const onError = (err: unknown) => {
        this.uppy.log(err as Error)
        this.uppy.emit('upload-error', file, err as Error)

        this.resetUploaderReferences(file.id)
        reject(err)
      }

      const onSuccess = (result: B) => {
        const uploadResp = {
          body: {
            ...result,
          },
          status: 200,
          uploadURL: result.location as string,
        }

        this.resetUploaderReferences(file.id)

        this.uppy.emit('upload-success', this.#getFile(file), uploadResp)

        if (result.location) {
          this.uppy.log(`Download ${file.name} from ${result.location}`)
        }

        resolve(undefined)
      }

      const upload = new MultipartUploader<M, B>(file.data, {
        // .bind to pass the file object to each handler.
        companionComm: this.#companionCommunicationQueue,

        log: (...args: Parameters<Uppy<M, B>['log']>) => this.uppy.log(...args),
        getChunkSize: this.opts.getChunkSize
          ? this.opts.getChunkSize.bind(this)
          : undefined,

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

        ...(file as MultipartFile<M, B>).s3Multipart,
      })

      this.uploaders[file.id] = upload
      const eventManager = new EventManager(this.uppy)
      this.uploaderEvents[file.id] = eventManager

      eventManager.onFileRemove(file.id, (removed) => {
        upload.abort()
        this.resetUploaderReferences(file.id, { abort: true })
        resolve(`upload ${removed} was removed`)
      })

      eventManager.onCancelAll(file.id, () => {
        upload.abort()
        this.resetUploaderReferences(file.id, { abort: true })
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

    const upload = await Promise.allSettled(promises)
    // After the upload is done, another upload may happen with only local files.
    // We reset the capability so that the next upload can use resumable uploads.
    this.#setResumableUploadsCapability(true)
    return upload
  }

  #setCompanionHeaders = () => {
    this.#client?.setCompanionHeaders(this.opts.headers!)
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

export type uploadPartBytes = (typeof AwsS3Multipart<
  any,
  any
>)['uploadPartBytes']
