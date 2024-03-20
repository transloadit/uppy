import BasePlugin, {
  type DefinePluginOpts,
  type PluginOpts,
} from '@uppy/core/lib/BasePlugin.js'
import { RequestClient } from '@uppy/companion-client'
import type { RequestOptions } from '@uppy/utils/lib/CompanionClientProvider.ts'
import type { Body as _Body, Meta, UppyFile } from '@uppy/utils/lib/UppyFile'
import type { Uppy } from '@uppy/core'
import EventManager from '@uppy/core/lib/EventManager.js'
import { RateLimitedQueue } from '@uppy/utils/lib/RateLimitedQueue'
import {
  filterNonFailedFiles,
  filterFilesToEmitUploadStarted,
} from '@uppy/utils/lib/fileFilters'
import { createAbortError } from '@uppy/utils/lib/AbortController'

import MultipartUploader from './MultipartUploader.ts'
import { throwIfAborted } from './utils.ts'
import type {
  UploadResult,
  UploadResultWithSignal,
  MultipartUploadResultWithSignal,
  UploadPartBytesResult,
  Body,
} from './utils.ts'
import createSignedURL from './createSignedURL.ts'
import { HTTPCommunicationQueue } from './HTTPCommunicationQueue.ts'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../package.json'

interface MultipartFile<M extends Meta, B extends Body> extends UppyFile<M, B> {
  s3Multipart: UploadResult
}

type PartUploadedCallback<M extends Meta, B extends _Body> = (
  file: UppyFile<M, B>,
  part: { PartNumber: number; ETag: string },
) => void

declare module '@uppy/core' {
  export interface UppyEventMap<M extends Meta, B extends _Body> {
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
  companionUrl: string
  companionHeaders?: Record<string, string>
  companionCookiesRule?: string
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
/** @deprecated Use signPart instead */
type AWSS3MultipartWithoutCompanionMandatoryPrepareUploadParts<
  M extends Meta,
  B extends Body,
> = {
  /** @deprecated Use signPart instead */
  prepareUploadParts: (
    file: UppyFile<M, B>,
    partData: {
      uploadId: string
      key: string
      parts: [{ number: number; chunk: Blob }]
      signal?: AbortSignal
    },
  ) => MaybePromise<{
    presignedUrls: Record<number, string>
    headers?: Record<number, Record<string, string>>
  }>
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
  | AWSS3MultipartWithoutCompanionMandatorySignPart<M, B>
  | AWSS3MultipartWithoutCompanionMandatoryPrepareUploadParts<M, B>
)

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
  shouldUseMultipart: ((file: UppyFile<any, any>) =>
    file.size !== 0) as any as true, // TODO: Switch default to:
  // eslint-disable-next-line no-bitwise
  // shouldUseMultipart: (file) => file.size >> 10 >> 10 > 100,
  retryDelays: [0, 1000, 3000, 5000],
  companionHeaders: {},
} satisfies Partial<AwsS3MultipartOptions<any, any>>

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
    AWSS3MultipartWithoutCompanionMandatorySignPart<M, B> &
    AWSS3NonMultipartWithoutCompanionMandatory<M, B>,
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
    // @ts-expect-error TODO: remove unused
    this.title = 'AWS S3 Multipart'
    // TODO: only initiate `RequestClient` is `companionUrl` is defined.
    this.#client = new RequestClient(uppy, opts as any)

    const dynamicDefaultOptions = {
      createMultipartUpload: this.createMultipartUpload,
      listParts: this.listParts,
      abortMultipartUpload: this.abortMultipartUpload,
      completeMultipartUpload: this.completeMultipartUpload,
      signPart:
        opts?.getTemporarySecurityCredentials ?
          this.createSignedURL
        : this.signPart,
      getUploadParameters:
        opts?.getTemporarySecurityCredentials ?
          (this.createSignedURL as any)
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
    if (
      (opts as AWSS3MultipartWithoutCompanionMandatoryPrepareUploadParts<M, B>)
        ?.prepareUploadParts != null &&
      (opts as AWSS3MultipartWithoutCompanionMandatorySignPart<M, B>)
        .signPart == null
    ) {
      this.opts.signPart = async (
        file: UppyFile<M, B>,
        { uploadId, key, partNumber, body, signal }: SignPartOptions,
      ) => {
        const { presignedUrls, headers } = await (
          opts as AWSS3MultipartWithoutCompanionMandatoryPrepareUploadParts<
            M,
            B
          >
        ).prepareUploadParts(file, {
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
  resetUploaderReferences(fileID: string, opts?: { abort: boolean }): void {
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
  ): Promise<B> {
    signal ??= oldSignal // eslint-disable-line no-param-reassign
    this.assertHost('completeMultipartUpload')
    throwIfAborted(signal)

    const filename = encodeURIComponent(key)
    const uploadIdEnc = encodeURIComponent(uploadId)
    return this.#client
      .post<B>(
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
  ): Promise<void> {
    signal ??= oldSignal // eslint-disable-line no-param-reassign
    this.assertHost('abortMultipartUpload')

    const filename = encodeURIComponent(key)
    const uploadIdEnc = encodeURIComponent(uploadId)
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
    return new Promise<void | string>((resolve, reject) => {
      const onProgress = (bytesUploaded: number, bytesTotal: number) => {
        this.uppy.emit('upload-progress', this.uppy.getFile(file.id), {
          // @ts-expect-error TODO: figure out if we need this
          uploader: this,
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
        getChunkSize:
          this.opts.getChunkSize ? this.opts.getChunkSize.bind(this) : null,

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

export type uploadPartBytes = (typeof AwsS3Multipart<
  any,
  any
>)['uploadPartBytes']
